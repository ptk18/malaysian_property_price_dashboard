from unittest.mock import Mock, patch

import numpy as np
import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from api.assessment import (
    PriceModel,
    assess_listing,
    comparable_listings,
    encode_inputs,
    listing_inputs,
)
from api.main import app
from api.shortlist import Listings, get_listings

COLUMNS = (
    "Property Size",
    "Bedroom",
    "Bathroom",
    "facility_count",
    "Property Type_Condominium",
    "Tenure Type_Leasehold",
    "Land Title_Non Bumi Lot",
    "state_Kuala Lumpur",
)


def source(**overrides):
    return {
        "Building Name": "Subject",
        "state": "Kuala Lumpur",
        "Property Type": "Condominium",
        "Property Size": 1000,
        "Bedroom": 3,
        "Bathroom": 2,
        "facility_count": 4,
        "Tenure Type": "Freehold",
        "Land Title": "Non Bumi Lot",
        "price": 500000,
        **overrides,
    }


@pytest.fixture
def model():
    predictor = Mock()
    predictor.predict.return_value = np.array([400000.0])
    return PriceModel(predictor, COLUMNS)


def test_estimate_uses_recorded_facts_and_correct_difference(model):
    data = Listings([source()], "fixture")
    with patch("api.assessment.get_price_model", return_value=model):
        result = assess_listing("fixture-00000", data)
    assert result["status"] == "available"
    assert result["estimated_price"] == 400000
    assert result["price_difference"] == 100000
    assert result["price_difference_pct"] == 25
    frame = model.estimator.predict.call_args.args[0]
    assert list(frame.columns) == list(COLUMNS)
    assert list(frame.iloc[0]) == [1000, 3, 2, 4, 1, 0, 1, 1]
    assert "price" not in frame.columns
    assert result["comparables"] == []
    assert "confidence" not in result


@pytest.mark.parametrize(
    "field",
    [
        "Property Size",
        "Bedroom",
        "Bathroom",
        "facility_count",
        "Tenure Type",
        "Land Title",
        "state",
        "price",
    ],
)
def test_missing_facts_do_not_load_model_or_invent_inputs(field):
    data = Listings([source(**{field: None})], "fixture")
    with patch("api.assessment.get_price_model") as loader:
        result = assess_listing("fixture-00000", data)
    loader.assert_not_called()
    assert result["status"] == "unavailable"
    assert result["estimated_price"] is None
    assert result["price_difference_pct"] is None
    assert result["unavailable_reason"].startswith("Not enough listing information")


def test_zero_facilities_is_valid_and_baseline_categories_encode_as_zero(model):
    row = source(
        **{
            "facility_count": 0,
            "Property Type": "Apartment",
            "Land Title": "Bumi Lot",
            "state": "Ampang",
        }
    )
    data = Listings([row], "fixture")
    frame = encode_inputs(listing_inputs(row, data.rows[0]), model)
    assert list(frame.iloc[0]) == [1000, 3, 2, 0, 0, 0, 0, 0]


@pytest.mark.parametrize(
    "field,value",
    [
        ("state", "Unsupported place"),
        ("Tenure Type", "Unknown tenure"),
        ("Land Title", "Unknown title"),
        ("Property Type", "Unknown type"),
    ],
)
def test_unknown_categories_are_not_treated_as_baseline(model, field, value):
    data = Listings([source(**{field: value})], "fixture")
    with patch("api.assessment.get_price_model", return_value=model):
        result = assess_listing("fixture-00000", data)
    assert result["status"] == "unavailable"
    assert result["unavailable_reason"].startswith("The saved model does not cover")
    model.estimator.predict.assert_not_called()


def test_comparables_keep_exact_rules_and_exclude_subject_and_duplicates():
    rows = [
        source(),
        source(),
        source(**{"Building Name": "Exact", "price": 800000}),
        source(**{"Building Name": "Larger", "Property Size": 1200}),
        source(**{"Building Name": "Smaller", "Property Size": 800}),
        source(**{"Building Name": "Fewer beds", "Bedroom": 2}),
        source(**{"Building Name": "Other location", "state": "Selangor"}),
        source(**{"Building Name": "Other type", "Property Type": "Apartment"}),
        source(**{"Building Name": "Too big", "Property Size": 1200.01}),
        source(**{"Building Name": "Too small", "Property Size": 799.99}),
        source(**{"Building Name": "Too many beds", "Bedroom": 5}),
        source(**{"Building Name": "Unknown price", "price": None}),
        source(**{"Building Name": "Exact", "price": 800000}),
    ]
    data = Listings(rows, "fixture")
    matches = comparable_listings(data.rows[0], data)
    assert [row["building_name"] for row in matches] == ["Exact", "Larger", "Smaller", "Fewer beds"]


def test_comparable_fractional_size_boundary_is_inclusive():
    data = Listings(
        [source(**{"Property Size": 1000.1}), source(**{"Property Size": 1200.12})], "fixture"
    )
    assert len(comparable_listings(data.rows[0], data)) == 1


@pytest.mark.parametrize("prediction", [0, -1, float("nan"), float("inf")])
def test_invalid_model_output_is_unavailable(model, prediction):
    model.estimator.predict.return_value = np.array([prediction])
    with (
        patch("api.assessment.get_price_model", return_value=model),
        pytest.raises(HTTPException) as exc,
    ):
        assess_listing("fixture-00000", Listings([source()], "fixture"))
    assert exc.value.status_code == 503


def test_failed_inference_does_not_expose_internal_details(model):
    model.estimator.predict.side_effect = RuntimeError("private model diagnostic")
    with (
        patch("api.assessment.get_price_model", return_value=model),
        pytest.raises(HTTPException) as exc,
    ):
        assess_listing("fixture-00000", Listings([source()], "fixture"))
    assert exc.value.detail == "Price assessment is temporarily unavailable."


def test_assessment_route_contract_comparable_limit_and_stale_id(model):
    rows = [
        source(**{"Building Name": f"Property {i}", "Property Size": 1000 + i}) for i in range(6)
    ]
    data = Listings(rows, "fixture")
    app.dependency_overrides[get_listings] = lambda: data
    try:
        with (
            TestClient(app) as client,
            patch("api.assessment.get_price_model", return_value=model) as loader,
        ):
            assert client.get("/api/health").status_code == 200
            loader.assert_not_called()
            response = client.get("/api/listings/fixture-00000/assessment")
            assert response.status_code == 200
            result = response.json()
            assert result["listing_id"] == "fixture-00000"
            assert result["comparable_count"] == 5
            assert len(result["comparables"]) == 3
            assert client.get("/api/listings/old-dataset-00000/assessment").status_code == 404
            assert loader.call_count == 1
    finally:
        app.dependency_overrides.clear()
