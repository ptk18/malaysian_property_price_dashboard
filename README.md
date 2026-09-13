# Property shortlist

An agent workspace for turning buyer requirements into an explainable property shortlist. Review AI-extracted filters, inspect ranked matches, compare up to three properties, and explore the underlying listing data.

## Features

- **Editable brief extraction:** Gemini proposes location, property type, target budget, and bedroom count. Search starts only after confirmation.
- **Deterministic matching:** location and type stay exact; price allows ±10% of the target and bedrooms allow ±1. Exact bedroom matches rank first, followed by price proximity.
- **Visible tradeoffs:** result cards and comparison show asking prices, size, bedrooms, price per square foot, and deviations from the confirmed request.
- **Dataset analytics:** listing counts, median asking prices, price distribution, and location comparisons, with missing data and the upper price tail disclosed.
- **Manual fallback:** filtering works without AI. Server-side extraction has a persistent daily request cap, bounded inputs, and safe error responses.

## Quick start

Use Python 3.14 and Node.js 24 or newer. From the repository root:

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r api/requirements-dev.txt
.venv/bin/python -m uvicorn api.main:app --reload --host 127.0.0.1 --port 8000
```

In a separate terminal:

```bash
cd frontend
npm ci
npm run dev
```

Open `http://127.0.0.1:3000`. Select **Try sample filters**, review the ranges, and select **Find properties**. This path works without an API key.

AI is disabled by default. To enable extraction, supply `GEMINI_API_KEY` in private backend configuration and set `AI_ENABLED=true`. The default model is `gemini-3.8-flash`. Keep the key out of frontend variables and source control. See the [deployment guide](_docs/deployment.md) for configuration and usage limits.

## Architecture

The Next.js frontend separates workflow state, input controls, result rendering, and comparison. FastAPI owns listing normalization, matching, analytics, and provider access. Gemini only proposes filter values; server code validates them and enforces eligibility.

- `api/schemas.py`: request validation and response contracts.
- `api/shortlist.py`: read-only dataset adapter, matching, and analytics.
- `api/brief.py` and `api/quota.py`: provider integration and persistent request limits.
- `api/demo.py`: shortlist routes; `api/main.py` also retains the original analytics and prediction routes.
- `frontend/components/` and `frontend/hooks/`: UI components and workflow state.
- `frontend/lib/`: HTTP requests, shared types, formatting, and sample briefs.

FastAPI exposes the API schema at `http://127.0.0.1:8000/docs`. The new UI does not depend on a prediction model. Legacy prediction loads optional artifacts on demand and returns an unavailable response when its dependencies or artifacts are absent; its saved model has not been revalidated.

## Development checks

From the repository root:

```bash
.venv/bin/ruff check api
.venv/bin/ruff format --check api
.venv/bin/python -m pytest
```

From `frontend/`:

```bash
npm run lint
npm run format:check
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Use `ruff format api` and `npm run format` to apply formatting. Browser tests build the production frontend, start isolated servers on ports 3017 and 8017, use the actual CSV for matching and analytics, and mock Gemini responses. Screenshots and traces are excluded from source control.

To serve the production frontend locally, run `npm run build` followed by `npm run start`.

## Containers

```bash
docker compose up --build
```

The frontend runs on port 3000 and the API on port 8000. Both containers use non-root users. A named volume preserves the daily quota across backend restarts. See [deployment.md](_docs/deployment.md) for HTTPS, CORS, persistent storage, and release checks.

## Data and limitations

The cleaned dataset contains **3,604 advertised listings**, a median asking price of **RM345,000**, **81 dataset-location labels**, and **76 listings without a location label**. Source: [Raw Malaysian Housing Prices Data](https://www.kaggle.com/datasets/mcpenguin/raw-malaysian-housing-prices-data).

These figures describe the supplied dataset. Listing freshness, availability, and achieved transaction prices are unverified. The source `state` field mixes geographic levels; the application preserves those labels as **dataset location** and does not infer nearby areas or state membership.

Gemini integration is verified with mocked responses; live model evaluation and public deployment remain pending. Workflow time savings and user acceptance have not yet been measured.

## Project documentation

- [Product scope and API contracts](_docs/plan.md)
- [Implementation backlog](_docs/tasks.md)
- [Development process](_docs/process.md)
- [Testing guidelines](_docs/testing-guidelines.md)
- [Design system](_docs/design-system.md)
- [Verification record](_docs/verification.md)
- [Demo walkthrough and engineering decisions](_docs/demo-walkthrough.md)
