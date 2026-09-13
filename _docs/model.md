# Listing-price model

## Purpose and provenance

The optional assessment compares a dataset listing's asking price with a model estimate of advertised prices. It is not a formal valuation, transaction-price estimate, confidence interval, or investment recommendation.

The preserved artifact in `model/model.pkl` is a **RandomForestRegressor with 100 trees**, serialized with scikit-learn **1.6.1**. The notebook `02_EDA.ipynb` compares Linear Regression, Random Forest, and XGBoost and saves its selected estimator. XGBoost was a candidate; it is not the saved model used for assessment. Neither saved artifact was modified or retrained for this feature.

## Inputs and encoding

The model uses size, bedrooms, bathrooms, facility count, property type, tenure, land title, and dataset location. The API reads these from the existing listing's source row; clients provide a stable listing ID, not replacement model inputs.

The notebook applies `get_dummies(..., drop_first=True)`. The saved feature list has 79 columns and matches the encoding reconstructed from the 2,967 complete source records. Its omitted baseline categories are Apartment, Freehold, Bumi Lot, and Ampang. The assessment encoder explicitly accepts those baselines and rejects unknown categories instead of silently mapping them to all zeros.

Missing facts remain missing. An estimate is unavailable if any required input or asking price is missing, and model failures produce a recoverable service error. A recorded facility count of zero is valid. Asking price and price per square foot are not predictor inputs.

## Runtime

The API image uses Python 3.13 with scikit-learn 1.6.1, pandas 2.2.3, NumPy 2.2.6, SciPy 1.15.3, and joblib 1.4.2. These are the tested inference pins; the complete original training environment was not recorded. Cross-version scikit-learn warnings are treated as load failures, and the artifact's class and feature names are checked before inference. The estimator uses one worker and loads on demand so ordinary shortlisting does not require it.

Only the repository's trusted local model files are loaded. The API accepts no uploaded model or model path. See scikit-learn's [model persistence guidance](https://scikit-learn.org/stable/model_persistence.html) for compatibility and serialization constraints.

## Comparable advertisements

Comparables keep dataset location and property type exact, size within ±20%, and bedroom count within ±1. They exclude the subject and exact duplicates of normalized listing facts, then sort by bedroom difference, size difference, and stable ID. The endpoint returns the eligible count and the first three records; it never expands the rules to manufacture a comparison.

The price difference is `asking price - model estimate`. The percentage divides that difference by the model estimate. Positive and negative values are shown as above or below the estimate, without good-deal labels or the old heuristic confidence score.

## Verification and limits

On 2026-09-13, batch inference produced finite positive estimates for all **2,967** records with complete inputs. **637** listings have missing model inputs. No otherwise complete record had an unsupported category. This is an inference compatibility check, not evidence of predictive accuracy.

The first Kuala Lumpur / Condominium / RM500,000 / 3-bedroom match, The Palladium, produced an estimate of **RM440,556.67**. Its RM500,000 asking price was **RM59,443.33 (13.49%) above** that estimate. The local API container reproduced those values with networking disabled.

The dataset may overlap model training records, and comparable advertisements are not independent validation. The feature does not claim a new holdout score, calibrated uncertainty, current market accuracy, verified availability, or condition-adjusted value. A fresh independent evaluation and a versioned training pipeline remain future work.
