# Development process

## Planning

The product scope and API contracts live in [plan.md](plan.md). The session-sized backlog lives in [tasks.md](tasks.md). Before implementation, review the assigned task, inspect the current diff, and identify its dependencies. Record material scope or contract changes in the plan before updating dependent code.

Before writing tests, read [testing-guidelines.md](testing-guidelines.md). For any UI change, read [design-system.md](design-system.md).

## Implementation

Keep changes bounded by the task's acceptance criteria. Frontend work can use contract fixtures while backend endpoints are in progress. Matching and analytics remain deterministic; model output is validated and presented for review before searching.

Preserve source data and unrelated changes. Keep credentials out of source control and use mocked provider responses for routine verification. Live model evaluation and publication are separate release steps.

## Review

A change is ready for review when:

- Its behavior matches the documented scope and handles relevant failure states.
- Formatting, lint, type checks, and focused tests pass.
- UI changes have been checked at desktop and mobile widths and with keyboard input.
- Comments explain decisions that are not evident from the code.
- Documentation covers configuration, verification, and remaining limitations.

Use a concise handoff describing the problem, the resulting behavior, evidence from checks, and outstanding work. A task can be transferred with its description, the shared contracts, and current artifact status.

## Current status

The local implementation covers brief review, ranked matching, property comparison, analytics, automated tests, and container packaging. See [verification.md](verification.md) for the tested revision's evidence and [deployment.md](deployment.md) for release steps.

Live Gemini evaluation and public deployment remain pending. User research and workflow-impact measurement are planned follow-up work.
