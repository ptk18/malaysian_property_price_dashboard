# Repository guide

Property shortlist is a Next.js and FastAPI application for reviewing buyer requirements, matching advertised properties, and comparing listing facts.

## Project context

- Read `_docs/plan.md` for scope, matching rules, and API contracts.
- Read `_docs/tasks.md` and `_docs/process.md` for work organization and delivery status.
- Before writing tests, read `_docs/testing-guidelines.md`.
- For UI changes, read `_docs/design-system.md` and the relevant version-matched guides in `frontend/node_modules/next/dist/docs/`.

## Code conventions

- Keep matching and analytics deterministic in the backend; AI only proposes editable inputs.
- Define API contracts in `api/schemas.py` and mirror them in `frontend/lib/types.ts`.
- Use small, focused components and hooks. Separate HTTP handling, formatting, and state transitions.
- Add comments for constraints and non-obvious decisions; avoid narrating individual statements.
- Run Ruff for Python and ESLint, Prettier, TypeScript, and relevant tests for frontend changes.
- Preserve source datasets, notebooks, model artifacts, and unrelated changes.
- Keep documentation reproducible and product-focused. Distinguish measured results from hypotheses.

## Agent boundaries

Keep credentials server-side and out of logs, generated files, and commits. Use mocked model responses in automated tests; obtain explicit authorization before paid model requests. External services are read-only during agent work, and publication is a maintainer action. Work serially unless delegation is explicitly requested.
