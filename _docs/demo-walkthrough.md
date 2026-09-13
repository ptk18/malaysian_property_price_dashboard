# Demo walkthrough

## Two-minute flow

1. **Introduce the task:** turn a buyer's brief into an explainable shortlist.
2. **Review inputs:** choose the Kuala Lumpur condo sample. Extract filters if AI is enabled, or use **Try sample filters** for the offline path. Show that every value can be edited.
3. **Confirm the ranges:** a RM500,000 target and three bedrooms permit RM450,000–RM550,000 and two to four bedrooms, while location and type stay exact.
4. **Inspect matches:** show exact-bedroom matches first and identify a price or bedroom tradeoff.
5. **Compare properties:** select three listings, compare their facts, remove one, and return to results.
6. **Inspect context:** open Analytics and explain the dataset-wide median, location comparisons, upper price tail, and missing-location count.

When using the offline path, state that extraction is disabled. The application is a prototype; user research and workflow-impact measurement are still pending.

## Sample briefs

- “Looking for a 3-bedroom condominium in Kuala Lumpur with a target budget of RM500,000.” The current dataset yields 72 matches; the first 50 are displayed.
- “A 3-bedroom apartment in Selangor, with a target budget of RM300,000.” The current dataset yields 147 matches; the first 50 are displayed.
- “Under RM500,000” illustrates the explicit review required when hard-limit wording conflicts with a target-budget range.

These are matches in the supplied dataset, not verified available inventory.

## Engineering decisions

- **Deterministic eligibility:** the model proposes inputs; backend code enforces location, type, budget, and bedroom rules. Decimal comparisons preserve inclusive price boundaries.
- **Human confirmation:** extraction does not start a search. Request-version checks prevent delayed responses from overwriting newer edits.
- **Bounded provider access:** each attempt reserves a durable daily quota slot before reaching Gemini. Failed requests count against the cap, and invalid responses become safe errors.
- **Explicit data limitations:** location labels are preserved without inferring geographic containment. Missing facts remain unavailable, and analytics use advertised asking prices.
- **Reviewable UI:** input controls, workflow state, result cards, comparison, and analytics have separate responsibilities. Browser checks cover selection limits and small-screen layout.

## Review findings and corrections

A browser test originally matched both the quota message and Next.js's hidden route announcer. Scoping the assertion to the intended message resolved that test failure. Screenshot review also led to a nonwrapping comparison button and predictable navigation to the comparison heading.

A later code review found that unusually large JSON numbers and malformed provider envelopes could escape the intended error handling. Validation now rejects those cases, with regression tests covering each failure shape.

## Planned validation

Compare manual and assisted shortlisting on equivalent briefs with a small group of agents. Measure completion time, reviewer acceptance, constraint violations, and unsupported statements. Define targets before the study and record changes prompted by feedback. No workflow-impact result is claimed before that evaluation.
