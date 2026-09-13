# Implementation backlog

Each task is scoped to one focused session and can be handed off with the shared contracts in `plan.md`. Read `process.md` before beginning, `testing-guidelines.md` before writing tests, and `design-system.md` for UI work. Local implementation and one live provider flow are verified; broader live evaluation and public deployment remain pending. See `verification.md` for evidence.

## 1. Set up an empty project with a passing test
Goal: Establish an empty runnable frontend with one passing smoke test.
Description: Scaffold a minimal Next.js and TypeScript project inside the currently empty `frontend/` directory, preserving the existing backend, dataset, notebooks, and models. Add a minimal root page and one smoke test showing that the empty application renders, with documented development and test commands. This task has no implementation dependencies and must not add shortlist features or call a paid API.

## 2. Establish the listing data contract and independent startup
Goal: Make the existing dataset available to the demo without requiring a prediction model.
Description: In the FastAPI backend, add the listing adapter, deterministic dataset-versioned IDs, and `/api/health` and `/api/shortlist/options` contracts from `_docs/plan.md`, using the current CSV as the source. Normalize only label whitespace/case, preserve nullable facts, validate matching fields, and present `state` values as dataset locations rather than verified states. Ensure shortlist startup does not load prediction artifacts, preserving existing prediction behavior through deferred loading and a clear unavailable response if necessary; verify ID stability, options, and startup without a model.

## 3. Implement deterministic ranked property matching
Goal: Return eligible listings in the agreed bedroom-first order.
Description: Implement `POST /api/shortlist` against the data adapter from task 2 and the exact response contract in `_docs/plan.md`; location/type are exact, price is within ±10%, and bedrooms within ±1 of confirmed inputs. Sort by absolute bedroom difference, absolute price difference, and stable ID; return at most 50 results with the full qualifying count and explicit numeric deviations. Test inclusive boundaries, wrong locations/types, invalid inputs, no matches, null matching fields, and ties using synthetic fixtures independent of the real dataset.

## 4. Build the Shortlist and Analytics page shell
Goal: Provide a responsive two-tab application shell with clear dataset context.
Description: Extend the frontend foundation from task 1 with Shortlist and Analytics navigation, a main content area, and concise MYR, square-foot, historical-listing, and dataset-location context following `_docs/design-system.md`. Create reusable loading, error, empty, and unavailable-value presentations without adding matching logic. Use fixtures for unfinished routes and ensure keyboard navigation and mobile layout work.

## 5. Build the editable brief and filter form
Goal: Let an agent review and explicitly confirm all four search inputs.
Description: In the Shortlist screen from task 4, build an English brief input, sample-brief controls, editable budget/bedroom/location/type fields, and a separate Find properties action using `/api/shortlist/options`. Show the inclusive budget and bedroom ranges and prevent searching until required fields are valid; preserve manual entry when AI is unavailable. Implement the parse loading/error/review-note states against the documented `/api/brief/parse` contract using fixtures until the endpoint is available, including a warning for hard-budget wording that conflicts with the target-budget interpretation.

## 6. Add protected Gemini brief extraction
Goal: Extract reviewable filters without exposing credentials or bypassing the daily cap.
Description: Implement `/api/brief/parse` using server-side `GEMINI_API_KEY`, configurable `gemini-3.8-flash`, recognized dataset options from task 2, and the contract in `_docs/plan.md`; validate structured output and leave missing or unrecognized values null with review notes. Bound input/output and timeout, disable automatic retries, and reserve each upstream attempt atomically in a durable SQLite UTC-day counter before calling Gemini, using the proposed configurable 100-attempt default and failing closed if quota storage is unavailable. With a mocked provider, verify malformed output, missing fields, hard-cap review notes, unsupported instructions, timeout, simultaneous quota requests, restart persistence, and exhausted-quota recovery; do not make paid calls without explicit authorization.

## 7. Connect the brief review flow end to end
Goal: Connect AI extraction, human edits, and confirmed search without losing user intent.
Description: Wire the form from task 5 to the parsing endpoint from task 6 and shortlist endpoint from task 3, using the shared contracts rather than duplicating parsing or matching rules in the browser. Ensure extraction never launches a search, manual edits determine submitted values, stale asynchronous responses cannot overwrite a newer brief or search, and confirmed new searches clear old comparison selections. Verify extraction failure still allows manual filtering and that raw provider errors or secrets are never shown to users.

## 8. Build ranked result cards and selection controls
Goal: Make match quality and property selection understandable at a glance.
Description: Render the shortlist response from task 3 within the shell from task 4, showing building name, dataset location, type, asking price, size, bedroom count, and textual price/bedroom deviations under the design-system rules. Preserve server ranking, distinguish total matches from the displayed limit, and allow selecting at most three distinct stable listing IDs. Handle no results, failed requests, missing facts, and selection limits with useful text; use contract fixtures if the integration task is not finished.

## 9. Build the property comparison view
Goal: Compare up to three selected properties using facts and visible tradeoffs.
Description: Using the `Listing` contract and selection controls from task 8, add a comparison view for price, size, bedrooms, bathrooms where available, price per square foot, dataset location, property type, and deviations from the confirmed request. Support removing a listing and returning to the existing results while retaining current filters, and display missing values as unavailable rather than zero. Keep the layout usable on mobile and by keyboard; this task must not add prediction estimates or AI summaries.

## 10. Expose reconciled analytics for the full dataset
Goal: Provide trustworthy global KPI and chart data through one documented endpoint.
Description: Implement `/api/analytics/overview` from `_docs/plan.md`, reusing correct existing aggregation logic to return listing count, median asking price, price distribution, and count/median-price rows by dataset location. Explicitly account for missing locations and include labeled overflow treatment if retaining the current 95th-percentile histogram cap, so histogram counts reconcile to valid-price rows and location counts plus missing locations reconcile to the total. Verify calculations with a small hand-checkable fixture and spot-check the real CSV without retraining a model or altering source data.

## 11. Build the Analytics tab
Goal: Display global dataset summaries and location comparisons clearly.
Description: In the shell from task 4, render the endpoint from task 10 as listing-count and median-price cards, an asking-price distribution chart, and location listing-count/median-price comparisons. Label all values as global asking-price data in MYR, show missing-location coverage, and distinguish any overflow bucket from ordinary equal-width bins. Follow `_docs/design-system.md` for chart colors, readable labels, accessible numeric alternatives, and small-screen behavior; do not imply time trends or transaction values.

## 12. Validate the complete demo workflow
Goal: Establish that the agreed user flow works and fails predictably.
Description: Once the form, matching, results, comparison, and analytics are connected, run focused backend checks, frontend checks, and a production build under `_docs/testing-guidelines.md`. Add or run a small mocked end-to-end suite covering brief extraction and editing, bedroom-first results, three-property comparison, manual fallback after AI failure/quota exhaustion, empty results, and Analytics navigation. Inspect desktop and mobile layouts and keyboard flow, record actual outcomes, and fix failures within scope; request authorization separately if a live paid Gemini check is needed.

## 13. Prepare deployment configuration and release instructions
Goal: Package the tested application for deployment with persistent quota storage.
Description: Using the completed application and existing Docker setup, prepare local deployment files and instructions for a public frontend and single-instance FastAPI backend with persistent quota storage, HTTPS, explicit CORS origins, server-only secrets, and a configurable public API base URL. Verify the local production configuration, cap persistence, graceful missing-key behavior, and absence of secrets from frontend artifacts; hosting choice must satisfy the topology described in `_docs/plan.md`. Document release steps, environment settings, and rollback procedures; record the public URL only after deployment is verified.

## 14. Document the demo and engineering decisions
Goal: Explain what the demo solves, how it works, and what was actually verified.
Description: Update the README and write a concise walkthrough using real supported sample briefs, actual startup/test commands, dataset limitations, and the implemented features from `_docs/plan.md`; include a live link only when publication is verified. Document engineering decisions, known limitations, and remaining acceptance criteria using observed evidence. Provide a two-minute demo script covering brief review, ranked tradeoffs, comparison, and analytics, and describe future user-testing metrics separately from observed evidence.

## 15. Assess a matched listing’s asking price
Goal: Restore the saved price model as an optional detail action within shortlisting.
Description: Add an assessment endpoint keyed by stable listing ID, using actual recorded features, validated model categories, and explicit handling of unavailable estimates. Show the estimate, signed asking-price difference, and strictly matched comparable advertisements in an accessible detail dialog, preserving the user's shortlist and comparison state. Pin compatible inference dependencies, package the existing model for deployment, and verify backend contracts, browser recovery and keyboard behavior, and real container inference without paid AI calls.
