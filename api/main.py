import os
from functools import lru_cache
from pathlib import Path

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from api.demo import router

BASE_DIR = Path(__file__).resolve().parent.parent
df = pd.read_csv(BASE_DIR / "data" / "houses_cleaned.csv")


@lru_cache(maxsize=1)
def prediction_artifacts():
    try:
        import joblib

        return (
            joblib.load(BASE_DIR / "model" / "model.pkl"),
            joblib.load(BASE_DIR / "model" / "feature_columns.pkl"),
        )
    except Exception:
        raise HTTPException(
            503, "Legacy prediction is unavailable. Property shortlisting is still available."
        ) from None


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
        ).split(",")
        if origin.strip()
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router)


@app.exception_handler(RequestValidationError)
async def invalid_request(request: Request, exc: RequestValidationError):
    # Never echo raw buyer briefs or submitted values in validation errors.
    return JSONResponse(
        status_code=422, content={"detail": "Check the required fields and their allowed values."}
    )


@app.get("/api/stats")
def get_stats():
    return {
        "total_listings": int(len(df)),
        "avg_price": round(df["price"].mean()),
        "median_price": round(df["price"].median()),
        "avg_size": round(df["Property Size"].mean()),
        "median_price_per_sqft": round(df["price_per_sqft"].median(), 2),
    }


@app.get("/api/filters")
def get_filters():
    return {
        "states": sorted(df["state"].dropna().unique().tolist()),
        "property_types": sorted(df["Property Type"].dropna().unique().tolist()),
        "tenure_types": sorted(df["Tenure Type"].dropna().unique().tolist()),
        "price_min": int(df["price"].min()),
        "price_max": int(df["price"].max()),
    }


@app.get("/api/listings")
def get_listings(
    state: str | None = None,
    property_type: str | None = None,
    tenure_type: str | None = None,
    min_price: int | None = None,
    max_price: int | None = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    filtered = df.copy()
    if state:
        filtered = filtered[filtered["state"] == state]
    if property_type:
        filtered = filtered[filtered["Property Type"] == property_type]
    if tenure_type:
        filtered = filtered[filtered["Tenure Type"] == tenure_type]
    if min_price is not None:
        filtered = filtered[filtered["price"] >= min_price]
    if max_price is not None:
        filtered = filtered[filtered["price"] <= max_price]

    total = len(filtered)
    start = (page - 1) * per_page
    page_df = filtered.iloc[start : start + per_page]

    cols = [
        "Building Name",
        "Property Type",
        "Property Size",
        "Bedroom",
        "Bathroom",
        "price",
        "state",
        "Tenure Type",
        "price_per_sqft",
    ]
    records = page_df[cols].where(page_df[cols].notna(), None).to_dict(orient="records")

    return {"total": total, "page": page, "per_page": per_page, "data": records}


@app.get("/api/charts/price-distribution")
def price_distribution():
    prices = df["price"].dropna()
    cap = float(prices.quantile(0.95))
    capped = prices[prices <= cap]
    counts, edges = np.histogram(capped, bins=20)
    bins = []
    for i in range(len(counts)):
        bins.append(
            {
                "bin_start": round(edges[i]),
                "bin_end": round(edges[i + 1]),
                "count": int(counts[i]),
            }
        )
    overflow_count = int((prices > cap).sum())
    if overflow_count > 0:
        bins.append(
            {
                "bin_start": round(cap),
                "bin_end": round(float(prices.max())),
                "count": overflow_count,
                "is_overflow": True,
            }
        )
    return {
        "bins": bins,
        "median": round(float(prices.median())),
        "percentile_95": round(cap),
        "total": int(len(prices)),
        "overflow_count": overflow_count,
    }


@app.get("/api/charts/price-by-state")
def price_by_state():
    grouped = df.groupby("state")["price"].agg(["mean", "median", "count"]).reset_index()
    grouped = grouped.sort_values("count", ascending=False)
    return [
        {
            "state": r["state"],
            "avg_price": round(r["mean"]),
            "median_price": round(r["median"]),
            "count": int(r["count"]),
        }
        for _, r in grouped.iterrows()
    ]


@app.get("/api/charts/price-by-location")
def price_by_location():
    grouped = df.groupby("state")["price"].agg(["mean", "median", "count"]).reset_index()
    grouped = grouped[grouped["count"] >= 10]
    grouped = grouped.sort_values("median", ascending=False).head(15)
    return [
        {
            "location": r["state"],
            "avg_price": round(r["mean"]),
            "median_price": round(r["median"]),
            "count": int(r["count"]),
        }
        for _, r in grouped.iterrows()
    ]


@app.get("/api/charts/price-by-type")
def price_by_type():
    grouped = df.groupby("Property Type")["price"].agg(["mean", "median", "count"]).reset_index()
    grouped = grouped.sort_values("median", ascending=False)
    return [
        {
            "property_type": r["Property Type"],
            "avg_price": round(r["mean"]),
            "median_price": round(r["median"]),
            "count": int(r["count"]),
        }
        for _, r in grouped.iterrows()
    ]


@app.get("/api/charts/price-vs-size")
def price_vs_size():
    subset = df[["price", "Property Size"]].dropna()
    if len(subset) > 1000:
        subset = subset.sample(1000, random_state=42)
    return [
        {"price": int(r["price"]), "size": int(r["Property Size"])} for _, r in subset.iterrows()
    ]


@app.get("/api/charts/price-vs-size-overview")
def price_vs_size_overview():
    subset = df[["price", "Property Size"]].dropna()
    subset = subset[subset["price"] <= 2_500_000]
    correlation = round(float(subset["price"].corr(subset["Property Size"])), 2)
    if len(subset) > 1000:
        sample = subset.sample(1000, random_state=42)
    else:
        sample = subset
    return {
        "data": [
            {"price": int(r["price"]), "size": int(r["Property Size"])}
            for _, r in sample.iterrows()
        ],
        "correlation": correlation,
        "total_points": int(len(subset)),
    }


@app.get("/api/charts/price-per-sqft-by-state")
def price_per_sqft_by_state():
    grouped = df.groupby("state")["price_per_sqft"].agg(["mean", "median"]).reset_index()
    return [
        {
            "state": r["state"],
            "avg_price_per_sqft": round(r["mean"], 2),
            "median_price_per_sqft": round(r["median"], 2),
        }
        for _, r in grouped.iterrows()
    ]


class PredictRequest(BaseModel):
    property_size: float
    bedroom: float
    bathroom: float
    facility_count: float
    property_type: str
    tenure_type: str
    land_title: str
    state: str


@app.post("/api/predict")
def predict(req: PredictRequest):
    model, feature_columns = prediction_artifacts()
    input_data = pd.DataFrame(
        [
            {
                "Property Size": req.property_size,
                "Bedroom": req.bedroom,
                "Bathroom": req.bathroom,
                "facility_count": req.facility_count,
                "Property Type": req.property_type,
                "Tenure Type": req.tenure_type,
                "Land Title": req.land_title,
                "state": req.state,
            }
        ]
    )
    input_encoded = pd.get_dummies(input_data)
    input_aligned = input_encoded.reindex(columns=feature_columns, fill_value=0)
    prediction = float(model.predict(input_aligned)[0])

    # Find comparable properties with progressive relaxation
    match_level = None
    comps = pd.Series(dtype=float)

    # Level 1: type + location + tight size (±20%)
    size_margin = req.property_size * 0.2
    comps = df[
        (df["Property Type"] == req.property_type)
        & (df["state"] == req.state)
        & (df["Property Size"] >= req.property_size - size_margin)
        & (df["Property Size"] <= req.property_size + size_margin)
    ]["price"].dropna()
    if len(comps) >= 5:
        match_level = "type + location + size (±20%)"
    else:
        # Level 2: type + location + wider size (±40%)
        size_margin = req.property_size * 0.4
        comps = df[
            (df["Property Type"] == req.property_type)
            & (df["state"] == req.state)
            & (df["Property Size"] >= req.property_size - size_margin)
            & (df["Property Size"] <= req.property_size + size_margin)
        ]["price"].dropna()
        if len(comps) >= 5:
            match_level = "type + location + size (±40%)"
        else:
            # Level 3: type + size only (±30%, no location)
            size_margin = req.property_size * 0.3
            comps = df[
                (df["Property Type"] == req.property_type)
                & (df["Property Size"] >= req.property_size - size_margin)
                & (df["Property Size"] <= req.property_size + size_margin)
            ]["price"].dropna()
            if len(comps) >= 5:
                match_level = "type + size (±30%, any location)"

    comparable_count = int(len(comps))
    if match_level and comparable_count >= 5:
        std = float(comps.std())
        mean = float(comps.mean())
        cv = std / mean if mean > 0 else 1.0
        count_score = min(comparable_count / 50, 1.0)
        spread_score = max(1.0 - cv, 0.0)
        confidence = round((count_score * 0.4 + spread_score * 0.6) * 100)
        price_low = round(float(comps.quantile(0.25)))
        price_high = round(float(comps.quantile(0.75)))
    else:
        confidence = None
        match_level = None
        price_low = None
        price_high = None

    return {
        "predicted_price": round(prediction),
        "confidence": confidence,
        "comparable_count": comparable_count,
        "match_level": match_level,
        "price_range_low": price_low,
        "price_range_high": price_high,
    }
