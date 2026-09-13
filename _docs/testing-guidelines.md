# Testing guidelines

Read this document before writing tests. Routine checks run offline with synthetic fixtures or the supplied CSV; live provider evaluation is a separate, opt-in step.

## Principles

- Test observable behavior and consequential failure cases, not copies of implementation details.
- Use small synthetic fixtures with hand-checkable expected results. Do not require network access, credentials, paid calls, or loading saved models for the normal suite.
- Keep a basic application smoke test alongside behavior-focused tests.
- Use focused backend tests for data, matching, parsing validation, quota enforcement, and analytics; frontend integration or end-to-end tests should cover user decisions and cross-layer failures.
- Do not add redundant snapshot tests or test every styling class. Verify visual changes through a browser when appropriate.
- Run checks relevant to the change and required build checks. Broaden testing only when failures or unresolved risks warrant it.

## Matching and data correctness

For a confirmed budget of RM500,000 and three bedrooms, eligible listings have prices from RM450,000 through RM550,000 and bedroom counts from two through four, inclusive, with exact confirmed dataset location and type. Include boundary cases just outside those ranges. Ensure an exact-bedroom listing ranks above a two/four-bedroom listing even if the latter is closer to budget; break equal bedroom deviations by absolute price difference and then stable ID.

Verify unknown labels, nonfinite/nonpositive budgets, fractional/negative bedroom inputs, missing matching facts, empty results, and normalization of recognized labels. Verify IDs are stable across repeated loads, filtering, and sorting for the same dataset version, including otherwise duplicate rows. Nullable nonmatching facts must remain unavailable rather than becoming fabricated values.

## AI extraction and quota

Mock the Gemini boundary and verify missing fields, unrecognized enum values, malformed JSON/structured output, unexpected types, out-of-range numbers, provider errors, and timeouts. A brief containing instructions to ignore application rules must not change matching rules or execute actions. Missing information and unsupported hard constraints must surface for review, not be invented or silently weakened.

Verify all upstream attempts reserve a daily slot first, concurrency cannot exceed the shared limit, UTC day rollover resets the allowance, restarts preserve usage, and unavailable quota storage blocks upstream calls. No retries should bypass counting. Check that client-visible errors and logged metadata exclude credentials and raw buyer briefs.

Live model evaluation is separate from the deterministic suite and requires explicit authorization for API spending. Record model ID, brief cases, expected fields, observed discrepancies, and usage metadata without recording keys; do not assume one successful prompt proves reliability.

## Frontend behavior

Cover extraction followed by edits and explicit confirmation, missing-field validation, manual entry after AI failure, stale-response handling, deterministic result display, selecting at most three distinct properties, removing a selection, and clearing selections after a new confirmed search. Check that a provider response never triggers search automatically or overwrites newer user input.

Cover loading, empty, error, quota-exhausted, and unavailable-data states. Inspect keyboard operation, focus visibility, labels, mobile and desktop widths, and comparison usability. Record the viewports and states inspected during browser verification.

## Analytics and delivery

Reconcile total count and median asking price against a hand-calculated fixture. Histogram counts must include overflow and sum to the valid-price population; location counts plus missing-location count must account for all rows. Verify values are global and charts do not imply a historical time series.

Before handoff, run the frontend production build and focused backend/frontend suites, check documented startup instructions, and inspect production configuration for correct API URLs and CORS. Confirm secrets are absent from browser bundles without printing secret values. Verify public availability separately after deployment.

Report commands, outcomes, and skipped checks with their reasons. Distinguish mocked integration checks from live-service verification.

## Style checks

Run `ruff check api` and `ruff format --check api` for Python. Run `npm run lint`, `npm run format:check`, and `npm run typecheck` from `frontend/` for TypeScript and UI changes. Fix reported issues without suppressing rules merely to obtain a passing result.
