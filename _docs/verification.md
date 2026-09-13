# Implementation verification

Verified locally on 2026-09-13. Automated checks use the supplied dataset and mocked Gemini responses. A separate live Gemini browser check is recorded below; public deployment remains unverified.

## Automated checks

- Backend: `.venv/bin/python -m pytest` — **63 passed**. Covers matching boundaries, deterministic ranking and IDs, missing data, analytics reconciliation, request and provider validation, response contracts, sanitized errors, concurrent quotas, persistence, UTC rollover, asking-price differences, feature encoding, missing inputs, unsupported categories, and strict comparable selection.
- Python style: `.venv/bin/ruff check api` and `.venv/bin/ruff format --check api` — passed.
- Frontend: `npm test` — **4 passed**. Covers rendering, editable extraction, explicit search confirmation, stale responses, and hard-limit review.
- Frontend style and types: `npm run lint`, `npm run format:check`, and `npm run typecheck` — passed.
- Production build: `npm run build` — passed.
- Browser: `npm run test:e2e` — **9 passed** against the production frontend and local API. Covers manual search, three-property comparison, selection reset, analytics, editable extraction, quota fallback, mobile overflow, keyboard entry, assessment details, missing estimates, retry, focus containment, and return to the selected card.
- Containers: `docker compose config --quiet` and `docker compose -p property-shortlist-demo build` — passed for both services. The API container smoke check used disabled networking and verified health, analytics, and disabled-AI behavior.

The backend suite emits two upstream deprecation warnings from the Starlette/AnyIO test stack. They do not fail the pinned test setup.

## Browser review

Playwright/Chromium checks cover desktop at 1440 × 1000 and mobile at 390 × 844. Reviewed states include entry, results, comparison, and analytics. Comparison scrolls within its own region on narrow screens; automated checks reject whole-page horizontal overflow.

Screenshots and failure traces are generated under ignored `frontend/test-results/`. These checks provide focused usability and keyboard coverage, not a comprehensive accessibility audit.

The UI has nine browser scenarios and four frontend integration tests. Browser coverage also checks that a completed mobile search focuses its results, comparison hides the cards, and returning restores the cards, retained selections, and Compare-button focus. Screenshots use reduced motion to capture settled control states. The updated production build, lint, formatting, and type checks pass.

Additional responsive checks at 320px, 390px, 768px, and 1440px found no whole-page horizontal overflow in results or analytics. The mobile price chart shows all bands without horizontal scrolling, and a mobile search with no matches brings its empty state into view. These UI checks made no live model requests.

## Data reconciliation

- 3,604 listings; RM345,000 median asking price.
- 81 nonempty dataset-location labels; 76 rows missing a location label.
- Histogram counts reconcile to all 3,604 valid asking prices, including the upper tail.
- Location counts plus missing-location count reconcile to all rows.
- Kuala Lumpur / Condominium / RM500,000 / 3 bedrooms: 72 matches, first 50 displayed.
- Selangor / Apartment / RM300,000 / 3 bedrooms: 147 matches, first 50 displayed.

## Live Gemini check

On 2026-09-13, three authorized requests used `gemini-3.8-flash`. The first two returned HTTP 400 because the REST request supplied `application/json` where the API requires the `APPLICATION_JSON` enum. The adapter and its provider-contract test were corrected using the [REST reference](https://ai.google.dev/api/generate-content#TextResponseFormat).

The final request succeeded through the production frontend and local API. The brief requested a three-bedroom condominium in Kuala Lumpur at a target budget of RM500,000. All four extracted fields matched expectations, with no review notes. The browser verified that extraction did not search automatically, changed the budget to RM480,000, explicitly confirmed the search, and compared three resulting properties.

The successful response reported 635 prompt tokens and 62 output tokens, 697 total. Rejected requests returned no usage metadata; no currency cost was inferred. The backend's 41 tests and Ruff checks passed after the fix.

This establishes one successful live workflow. Hard-budget wording, unsupported preferences, and missing fields still need live evaluation; their automated checks remain mocked. Temporary AI-enabled test servers were stopped after the check.

## Saved-model assessment

The saved Random Forest loaded under scikit-learn 1.6.1 in the Python 3.13 inference environment. All 2,967 complete listings produced finite positive estimates; 637 lacked required inputs. The deployment image reproduced the first sample listing's RM440,556.67 estimate, 13.49% asking-price difference, and three comparable records with networking disabled. A separate browser check using the real API verified The Palladium's above-estimate result and Platinum Lake PV 20's RM540,189 estimate with a 7.44% below-estimate asking price, then returned to comparison. Desktop and mobile screenshots were inspected. See [model.md](model.md) for provenance and limits. No saved models or source datasets were changed, and no live Gemini calls were made for this feature.

## Remaining validation

Broader live Gemini evaluation, public HTTPS availability, deployed CORS and quota persistence, user interviews, and measured workflow impact remain pending. See [deployment.md](deployment.md) for release steps and [demo-walkthrough.md](demo-walkthrough.md) for the review flow.
