"""Optional asking-price context from the saved model and comparable advertisements."""

import math
import warnings
from collections.abc import Mapping
from dataclasses import dataclass
from decimal import Decimal
from functools import lru_cache
from pathlib import Path
from typing import Protocol

import numpy as np
import pandas as pd
from fastapi import HTTPException

from api.schemas import Assessment, AssessmentInputs, ListingRecord
from api.shortlist import Listings, normalize_label, parse_number

MODEL_DIR = Path(__file__).resolve().parent.parent / "model"
COMPARABLE_LIMIT = 3
NUMERIC_FIELDS = {
    "size_sqft": "Property Size",
    "bedrooms": "Bedroom",
    "bathrooms": "Bathroom",
    "facility_count": "facility_count",
}
CATEGORICAL_FIELDS = {
    "property_type": "Property Type",
    "tenure": "Tenure Type",
    "land_title": "Land Title",
    "location": "state",
}
# The notebook's drop_first encoding omits these alphabetically first categories.
BASELINE_CATEGORIES = {
    "Property Type": "Apartment",
    "Tenure Type": "Freehold",
    "Land Title": "Bumi Lot",
    "state": "Ampang",
}
COMPARABLE_RULES = "Same location and property type, size within ±20%, and bedrooms within ±1."


class Predictor(Protocol):
    def predict(self, frame: pd.DataFrame) -> np.ndarray: ...


@dataclass(frozen=True)
class PriceModel:
    estimator: Predictor
    columns: tuple[str, ...]


@lru_cache(maxsize=1)
def get_price_model() -> PriceModel:
    try:
        import joblib
        from sklearn.ensemble import RandomForestRegressor
        from sklearn.exceptions import InconsistentVersionWarning

        with warnings.catch_warnings():
            warnings.simplefilter("error", InconsistentVersionWarning)
            estimator = joblib.load(MODEL_DIR / "model.pkl")
            columns = joblib.load(MODEL_DIR / "feature_columns.pkl")
        if (
            not isinstance(estimator, RandomForestRegressor)
            or not isinstance(columns, list)
            or not all(isinstance(column, str) for column in columns)
            or len(set(columns)) != len(columns)
            or columns != list(estimator.feature_names_in_)
            or not set(NUMERIC_FIELDS.values()).issubset(columns)
        ):
            raise ValueError("Unexpected model contract")
        estimator.set_params(n_jobs=1)
        return PriceModel(estimator, tuple(columns))
    except Exception:
        raise HTTPException(503, "Price assessment is temporarily unavailable.") from None


def listing_inputs(source: Mapping[str, object], listing: ListingRecord) -> AssessmentInputs:
    return {
        "size_sqft": listing["size_sqft"],
        "bedrooms": listing["bedrooms"],
        "bathrooms": listing["bathrooms"],
        "facility_count": parse_number(source.get("facility_count"), integer=True),
        "property_type": listing["property_type"],
        "tenure": normalize_label(source.get("Tenure Type")),
        "land_title": normalize_label(source.get("Land Title")),
        "location": listing["location"],
    }


def encode_inputs(inputs: AssessmentInputs, model: PriceModel) -> pd.DataFrame:
    values = dict.fromkeys(model.columns, 0.0)
    for field, column in NUMERIC_FIELDS.items():
        values[column] = float(inputs[field])
    for field, prefix in CATEGORICAL_FIELDS.items():
        value = inputs[field]
        if value == BASELINE_CATEGORIES[prefix]:
            continue
        column = f"{prefix}_{value}"
        if column not in values:
            raise ValueError(
                f"The saved model does not cover this listing's {field.replace('_', ' ')}."
            )
        values[column] = 1.0
    return pd.DataFrame([values], columns=model.columns)


def comparable_listings(subject: ListingRecord, data: Listings) -> list[ListingRecord]:
    if any(
        subject[field] is None for field in ("location", "property_type", "size_sqft", "bedrooms")
    ):
        return []
    subject_facts = tuple(value for key, value in subject.items() if key != "id")
    seen = {subject_facts}
    size = Decimal(str(subject["size_sqft"]))
    candidates = []
    for row in data.rows:
        facts = tuple(value for key, value in row.items() if key != "id")
        if (
            row["id"] == subject["id"]
            or row["location"] != subject["location"]
            or row["property_type"] != subject["property_type"]
            or row["price"] is None
            or row["size_sqft"] is None
            or row["bedrooms"] is None
            or not size * Decimal("0.8") <= Decimal(str(row["size_sqft"])) <= size * Decimal("1.2")
            or abs(row["bedrooms"] - subject["bedrooms"]) > 1
            or facts in seen
        ):
            continue
        seen.add(facts)
        candidates.append(row)
    candidates.sort(
        key=lambda row: (
            abs(row["bedrooms"] - subject["bedrooms"]),
            abs(row["size_sqft"] - subject["size_sqft"]),
            row["id"],
        )
    )
    return candidates


def assess_listing(listing_id: str, data: Listings) -> Assessment:
    subject = next((row for row in data.rows if row["id"] == listing_id), None)
    if subject is None:
        raise HTTPException(404, "This listing is no longer in the dataset. Run a new search.")
    inputs = listing_inputs(data.source_by_id[listing_id], subject)
    comparables = comparable_listings(subject, data)
    result: Assessment = {
        "listing_id": listing_id,
        "status": "unavailable",
        "asking_price": subject["price"],
        "estimated_price": None,
        "price_difference": None,
        "price_difference_pct": None,
        "unavailable_reason": None,
        "inputs": inputs,
        "comparable_count": len(comparables),
        "comparables": comparables[:COMPARABLE_LIMIT],
        "comparable_rules": COMPARABLE_RULES,
        "model_name": "Random Forest",
    }
    missing = [field.replace("_", " ") for field, value in inputs.items() if value is None]
    if subject["price"] is None:
        missing.append("asking price")
    if missing:
        result["unavailable_reason"] = "Not enough listing information: " + ", ".join(missing) + "."
        return result
    model = get_price_model()
    try:
        frame = encode_inputs(inputs, model)
    except ValueError as exc:
        result["unavailable_reason"] = str(exc)
        return result
    try:
        estimate = float(model.estimator.predict(frame)[0])
        if not math.isfinite(estimate) or estimate <= 0:
            raise ValueError("Invalid prediction")
    except Exception:
        raise HTTPException(503, "Price assessment is temporarily unavailable.") from None
    difference = subject["price"] - estimate
    result.update(
        status="available",
        estimated_price=round(estimate, 2),
        price_difference=round(difference, 2),
        price_difference_pct=round(difference / estimate * 100, 2),
    )
    return result
