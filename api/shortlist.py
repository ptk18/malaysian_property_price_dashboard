"""Normalize listing data, apply matching rules, and calculate dataset summaries."""

import csv
import hashlib
import io
import math
from collections.abc import Iterable, Mapping
from decimal import Decimal
from functools import lru_cache
from pathlib import Path
from statistics import median

import numpy as np

from api.schemas import (
    AnalyticsSummary,
    Filters,
    ListingOptions,
    ListingRecord,
    LocationSummary,
    MatchedListing,
    MatchResult,
    PriceBin,
)

RESULT_LIMIT = 50
HISTOGRAM_BINS = 12
PRICE_TAIL_QUANTILE = 0.95


def normalize_label(value: object) -> str | None:
    text = str(value).strip() if value is not None else ""
    return text if text and text.casefold() not in {"nan", "none", "-"} else None


def parse_number(
    value: object, *, positive: bool = False, integer: bool = False
) -> float | int | None:
    try:
        result = float(value)
        if not math.isfinite(result) or result < 0 or (positive and result == 0):
            return None
        if integer and not result.is_integer():
            return None
        return int(result) if integer else result
    except (ValueError, TypeError, OverflowError):
        return None


class Listings:
    """Read-only normalized records with stable IDs for a fixed dataset version."""

    def __init__(self, rows: Iterable[Mapping[str, object]], version: str) -> None:
        self.version = version
        self.rows: list[ListingRecord] = []
        self.source_by_id: dict[str, Mapping[str, object]] = {}
        locations: dict[str, str] = {}
        property_types: dict[str, str] = {}
        for index, row in enumerate(rows):
            self.source_by_id[f"{version}-{index:05d}"] = dict(row)
            location, kind = (
                normalize_label(row.get("state")),
                normalize_label(row.get("Property Type")),
            )
            if location:
                location = locations.setdefault(location.casefold(), location)
            if kind:
                kind = property_types.setdefault(kind.casefold(), kind)
            size = parse_number(row.get("Property Size"), positive=True)
            price = parse_number(row.get("price"), positive=True)
            self.rows.append(
                {
                    "id": f"{version}-{index:05d}",
                    "building_name": normalize_label(row.get("Building Name")),
                    "location": location,
                    "property_type": kind,
                    "price": price,
                    "size_sqft": size,
                    "bedrooms": parse_number(row.get("Bedroom"), integer=True),
                    "bathrooms": parse_number(row.get("Bathroom"), integer=True),
                    "price_per_sqft": price / size if price is not None and size else None,
                }
            )
        self.locations = locations
        self.types = property_types

    def options(self) -> ListingOptions:
        return {
            "dataset_version": self.version,
            "locations": sorted(self.locations.values()),
            "property_types": sorted(self.types.values()),
            "currency": "MYR",
            "area_unit": "sq ft",
        }

    def match(self, filters: Filters) -> MatchResult:
        location = self.locations.get(filters.location.strip().casefold())
        kind = self.types.get(filters.property_type.strip().casefold())
        if not location or not kind:
            raise ValueError("Choose a supported dataset location and property type.")
        # Decimal keeps inclusive price boundaries exact for fractional MYR budgets.
        budget = Decimal(str(filters.budget))
        lower, upper = budget * Decimal("0.9"), budget * Decimal("1.1")
        matches: list[MatchedListing] = []
        for row in self.rows:
            if row["location"] != location or row["property_type"] != kind:
                continue
            if row["price"] is None or row["bedrooms"] is None:
                continue
            price = Decimal(str(row["price"]))
            if not lower <= price <= upper or abs(row["bedrooms"] - filters.bedrooms) > 1:
                continue
            matches.append(
                {
                    **row,
                    "price_delta": float(price - budget),
                    "price_delta_pct": float((price - budget) / budget * 100),
                    "bedroom_delta": row["bedrooms"] - filters.bedrooms,
                }
            )
        matches.sort(key=lambda r: (abs(r["bedroom_delta"]), abs(r["price_delta"]), r["id"]))
        return {
            "total": len(matches),
            "limit": RESULT_LIMIT,
            "applied_filters": {
                **filters.model_dump(),
                "location": location,
                "property_type": kind,
            },
            "results": matches[:RESULT_LIMIT],
        }

    def analytics(self) -> AnalyticsSummary:
        prices = [r["price"] for r in self.rows if r["price"] is not None]
        bins: list[PriceBin] = []
        if prices:
            cap = float(np.quantile(prices, PRICE_TAIL_QUANTILE))
            ordinary = [p for p in prices if p <= cap]
            counts, edges = np.histogram(ordinary, bins=HISTOGRAM_BINS)
            bins = [
                {
                    "bin_start": float(edges[i]),
                    "bin_end": float(edges[i + 1]),
                    "count": int(count),
                    "is_overflow": False,
                }
                for i, count in enumerate(counts)
            ]
            overflow = sum(p > cap for p in prices)
            if overflow:
                bins.append(
                    {
                        "bin_start": cap,
                        "bin_end": max(prices),
                        "count": overflow,
                        "is_overflow": True,
                    }
                )
        groups: dict[str, list[ListingRecord]] = {}
        for row in self.rows:
            if row["location"]:
                groups.setdefault(row["location"], []).append(row)
        by_location: list[LocationSummary] = []
        for location, rows in groups.items():
            valid = [r["price"] for r in rows if r["price"] is not None]
            by_location.append(
                {
                    "location": location,
                    "count": len(rows),
                    "median_asking_price": median(valid) if valid else None,
                }
            )
        by_location.sort(key=lambda r: (-r["count"], r["location"]))
        return {
            "total_listings": len(self.rows),
            "median_asking_price": median(prices) if prices else None,
            "price_distribution": bins,
            "valid_price_count": len(prices),
            "by_location": by_location,
            "missing_location_count": sum(r["location"] is None for r in self.rows),
            "scope": "all_listings",
        }


@lru_cache(maxsize=1)
def get_listings() -> Listings:
    content = (Path(__file__).resolve().parent.parent / "data/houses_cleaned.csv").read_bytes()
    version = hashlib.sha256(content).hexdigest()[:12]
    return Listings(csv.DictReader(io.StringIO(content.decode("utf-8-sig"))), version)
