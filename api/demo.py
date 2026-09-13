"""HTTP endpoints for property shortlisting, brief extraction, and analytics."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from api.brief import parse_brief
from api.schemas import (
    AnalyticsSummary,
    BriefRequest,
    BriefResult,
    Filters,
    HealthResult,
    ListingOptions,
    MatchResult,
)
from api.shortlist import Listings, get_listings

router = APIRouter(prefix="/api")
ListingDependency = Annotated[Listings, Depends(get_listings)]


@router.get("/health")
def health(data: ListingDependency) -> HealthResult:
    return {"status": "ok", "dataset_version": data.version, "total_listings": len(data.rows)}


@router.get("/shortlist/options")
def options(data: ListingDependency) -> ListingOptions:
    return data.options()


@router.post("/shortlist")
def shortlist(filters: Filters, data: ListingDependency) -> MatchResult:
    try:
        return data.match(filters)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from None


@router.post("/brief/parse")
def extract(request: BriefRequest, data: ListingDependency) -> BriefResult:
    return parse_brief(request.brief, data)


@router.get("/analytics/overview")
def analytics(data: ListingDependency) -> AnalyticsSummary:
    return data.analytics()
