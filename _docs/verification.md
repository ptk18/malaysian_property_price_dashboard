# Implementation verification

Verified locally on 2026-09-13. Automated checks use the supplied dataset and mocked Gemini responses; live provider compatibility and public deployment remain unverified.

## Automated checks

- Backend: `.venv/bin/python -m pytest` — **41 passed**. Covers matching boundaries, deterministic ranking and IDs, missing data, analytics reconciliation, request and provider validation, response contracts, sanitized errors, concurrent quotas, persistence, and UTC rollover.
- Python style: `.venv/bin/ruff check api` and `.venv/bin/ruff format --check api` — passed.
- Frontend: `npm test` — **4 passed**. Covers rendering, editable extraction, explicit search confirmation, stale responses, and hard-limit review.
- Frontend style and types: `npm run lint`, `npm run format:check`, and `npm run typecheck` — passed.
- Production build: `npm run build` — passed.
- Browser: `npm run test:e2e` — **5 passed** against the production frontend and local API. Covers manual search, three-property comparison, selection reset, analytics, editable extraction, quota fallback, mobile overflow, and keyboard entry.
- Containers: `docker compose config --quiet` and `docker compose -p property-shortlist-demo build` — passed for both services. The API container smoke check used disabled networking and verified health, analytics, and disabled-AI behavior.

The backend suite emits two upstream deprecation warnings from the Starlette/AnyIO test stack. They do not fail the pinned test setup.

## Browser review

Playwright/Chromium checks cover desktop at 1440 × 1000 and mobile at 390 × 844. Reviewed states include entry, results, comparison, and analytics. Comparison scrolls within its own region on narrow screens; automated checks reject whole-page horizontal overflow.

Screenshots and failure traces are generated under ignored `frontend/test-results/`. These checks provide focused usability and keyboard coverage, not a comprehensive accessibility audit.

## Data reconciliation

- 3,604 listings; RM345,000 median asking price.
- 81 nonempty dataset-location labels; 76 rows missing a location label.
- Histogram counts reconcile to all 3,604 valid asking prices, including the upper tail.
- Location counts plus missing-location count reconcile to all rows.
- Kuala Lumpur / Condominium / RM500,000 / 3 bedrooms: 72 matches, first 50 displayed.
- Selangor / Apartment / RM300,000 / 3 bedrooms: 147 matches, first 50 displayed.

## Remaining validation

Live Gemini evaluation, public HTTPS availability, deployed CORS and quota persistence, user interviews, and measured workflow impact remain pending. See [deployment.md](deployment.md) for release steps and [demo-walkthrough.md](demo-walkthrough.md) for the review flow.
