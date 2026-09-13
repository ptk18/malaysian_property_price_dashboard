"""Request validation and response contracts for the shortlisting API."""

from typing import Literal, TypedDict

from pydantic import BaseModel, ConfigDict, Field


class Filters(BaseModel):
    model_config = ConfigDict(extra="forbid")

    location: str = Field(min_length=1, max_length=150)
    property_type: str = Field(min_length=1, max_length=80)
    budget: float = Field(gt=0, le=1e12, allow_inf_nan=False, strict=True)
    bedrooms: int = Field(ge=0, le=100, strict=True)


class BriefRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    brief: str = Field(min_length=1, max_length=2000)


class ListingRecord(TypedDict):
    id: str
    building_name: str | None
    location: str | None
    property_type: str | None
    price: float | None
    size_sqft: float | None
    bedrooms: int | None
    bathrooms: int | None
    price_per_sqft: float | None


class MatchedListing(TypedDict):
    id: str
    building_name: str | None
    location: str
    property_type: str
    price: float
    size_sqft: float | None
    bedrooms: int
    bathrooms: int | None
    price_per_sqft: float | None
    price_delta: float
    price_delta_pct: float
    bedroom_delta: int


class ConfirmedFilters(TypedDict):
    location: str
    property_type: str
    budget: float
    bedrooms: int


class MatchResult(TypedDict):
    total: int
    limit: int
    applied_filters: ConfirmedFilters
    results: list[MatchedListing]


class ListingOptions(TypedDict):
    dataset_version: str
    locations: list[str]
    property_types: list[str]
    currency: Literal["MYR"]
    area_unit: Literal["sq ft"]


class PriceBin(TypedDict):
    bin_start: float
    bin_end: float
    count: int
    is_overflow: bool


class LocationSummary(TypedDict):
    location: str
    count: int
    median_asking_price: float | None


class AnalyticsSummary(TypedDict):
    total_listings: int
    median_asking_price: float | None
    price_distribution: list[PriceBin]
    valid_price_count: int
    by_location: list[LocationSummary]
    missing_location_count: int
    scope: Literal["all_listings"]


class ExtractedFilters(TypedDict):
    location: str | None
    property_type: str | None
    budget: float | None
    bedrooms: int | None


class BriefResult(TypedDict):
    filters: ExtractedFilters
    review_notes: list[str]


class HealthResult(TypedDict):
    status: Literal["ok"]
    dataset_version: str
    total_listings: int
