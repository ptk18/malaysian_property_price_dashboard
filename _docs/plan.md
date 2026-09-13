# Property shortlisting plan

## Problem and intended outcome

An agent turning a buyer's brief into a property shortlist must translate preferences into filters, assess near matches, and explain tradeoffs. This application combines those steps in one reviewable workflow using an existing Malaysian listing dataset.

The product hypothesis is that editable AI extraction and explicit matching rules can reduce shortlisting effort. User interviews and measured time savings remain future validation work. The initial implementation was scoped to a one-day MVP.

## Scope

1. Enter an English buyer brief or choose a sample.
2. Use Gemini to propose editable location, property type, target budget, and bedroom filters.
3. Review the extracted values, resolve missing fields, and confirm the displayed search ranges.
4. Inspect ranked results with visible price and bedroom deviations.
5. Compare up to three properties side by side.
6. Open Analytics for full-dataset counts, median asking prices, price distribution, and location comparisons.

The intended deployment is a public demo without login. Manual filtering remains available when AI extraction is disabled, unavailable, or out of quota.

## Matching rules

- Dataset location and property type must match exactly after case and surrounding-whitespace normalization.
- Asking price must be within ±10% of the confirmed target budget, inclusive.
- Bedroom count must be within ±1 of the confirmed count, inclusive.
- Rank by absolute bedroom difference, then absolute price difference, then stable listing ID.
- Return the first 50 results and the total qualifying count.
- Never relax constraints automatically. Empty results prompt the agent to edit filters.

Budget is a target, not a hard maximum. Hard-limit wording is flagged for explicit review before the search can exceed the brief's stated amount. Unsupported or missing values are left for the agent to resolve. Predictions, investment recommendations, and model confidence scores are excluded from the shortlist.

## Data and architecture

The existing cleaned CSV contains 3,604 listings. Its `state` column has 81 nonempty labels and mixes geographic levels, so the application calls the field **dataset location**. Geographic containment, neighborhood equivalence, and nearby-area search are not inferred. Listing availability, freshness, and transaction values are unverified.

FastAPI owns data normalization, matching, analytics, and Gemini access. Next.js renders the interactive workflow. Listing IDs combine a dataset-content hash and source-row position, making them stable across searches for the same dataset version.

Source data, notebooks, and saved models are preserved. The legacy prediction endpoint loads its optional artifacts on demand; it is not required for shortlist startup or used by the new UI.

## API contracts

Python contracts are defined in `api/schemas.py`; frontend types are in `frontend/lib/types.ts`. FastAPI exposes the full schema at `/openapi.json`.

- `GET /api/health`: readiness, dataset version, and listing count.
- `GET /api/shortlist/options`: supported dataset locations and property types, currency, area unit, and dataset version.
- `POST /api/brief/parse`: accepts `{brief}` and returns nullable extracted filters plus review notes. It does not start a search.
- `POST /api/shortlist`: accepts confirmed `{location, property_type, budget, bedrooms}` and returns `{total, limit, applied_filters, results}`.
- `GET /api/analytics/overview`: full-dataset listing count, median asking price, valid-price count, histogram bins, location summaries, and missing-location count.

A result includes its ID, building name, location, type, price, size, bedrooms, bathrooms, price per square foot, and numeric deviations from the request. Missing source facts remain null. Input validation rejects unknown labels, nonfinite or nonpositive budgets, and negative or fractional bedroom counts; technical upper bounds are RM1 trillion and 100 bedrooms.

## AI boundaries

The configured model is `gemini-3.8-flash`. `GEMINI_API_KEY` is supplied only to the backend; `AI_ENABLED` defaults to false. Extraction uses structured output, server validation, a 2,000-character input limit, bounded output, a 15-second HTTP timeout, and no automatic retries.

Each upstream attempt reserves a slot in a durable SQLite counter before calling the provider. The default cap is 100 attempts per UTC day, including failed attempts. Quota storage failure blocks AI calls. The supported deployment uses one backend instance and a persistent volume; horizontal scaling requires an equivalent shared atomic counter. A request cap is not a currency spending limit.

Briefs and provider responses are not persisted by the application. Invalid output and service failures use safe client messages with a manual-entry fallback.

## Analytics and comparison

Analytics always summarize all listings and display asking prices in MYR. Twelve ordinary histogram bins cover prices up to the 95th-percentile cutoff; a separately labeled overflow bucket accounts for the remaining tail. Histogram counts reconcile to the valid-price population, and location counts plus missing-location count reconcile to the total.

Comparison shows listing facts and price/bedroom tradeoffs for up to three distinct listings. It supports removal and return to results. A new confirmed search clears old selections. Missing values display as unavailable.

## Acceptance criteria

- Extraction never triggers a search before confirmation, and delayed responses cannot overwrite newer edits.
- Results obey the agreed eligibility and ranking rules, including numeric boundaries and ties.
- Missing fields, invalid AI output, quota exhaustion, loading, errors, and empty results have usable recovery paths.
- Comparison works for up to three distinct listings at desktop and mobile widths.
- Analytics reconcile to the source data and disclose their scope and location limitations.
- Keys remain server-side, and the daily quota persists on the supported deployment topology.
- Formatting, lint, type checks, focused tests, browser checks, and production builds pass.
- A public release is verified separately after deployment, including live provider behavior and HTTPS configuration.

## Deferred work

Listing quality review, geographic normalization, comparable-property valuation, AI-written client summaries, conversational clarification, accounts, saved shortlists, CRM integration, maps, and Thai-market data are outside this MVP.

Follow-up validation should compare manual and assisted shortlisting using equivalent briefs. Measure completion time, reviewer acceptance, constraint violations, and unsupported statements. Keep targets separate from observed results and document changes prompted by feedback.

## References

- [Development backlog](tasks.md)
- [Testing guidelines](testing-guidelines.md)
- [Design system](design-system.md)
- [Deployment guide](deployment.md)
- [Verification](verification.md)
- [Source dataset](https://www.kaggle.com/datasets/mcpenguin/raw-malaysian-housing-prices-data)
- [Gemini model documentation](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash)
