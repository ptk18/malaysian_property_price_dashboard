# Deployment guide

The application is packaged as two containers. Public deployment and live Gemini evaluation remain pending.

## Supported topology

Use one FastAPI backend instance with a persistent writable volume mounted at `/app/runtime`, and a standalone Next.js frontend. Put both behind HTTPS on the selected container host; configure the browser to call the backend's public HTTPS URL. The frontend and backend can share a host with appropriate reverse-proxy routes or use separate origins.

The SQLite quota supports concurrent requests on the single backend instance and survives process/container restarts when the volume is preserved. Do not scale the backend horizontally or use ephemeral/serverless quota storage without replacing it with an equivalent atomic shared durable counter. Do not delete the quota volume during routine updates or rollback.

## Configuration

Frontend build-time settings:

- `NEXT_PUBLIC_API_BASE_URL`: public HTTPS backend origin, without a trailing slash. Default for local development is `http://127.0.0.1:8000`; the default Docker build uses `http://localhost:8000`.
- This value is embedded in the frontend build. Rebuild the frontend after changing it; browser traffic cannot reach a private Docker service name such as `api`.

Backend runtime settings:

- `AI_ENABLED`: `false` by default. Set to `true` when model usage is intended.
- `GEMINI_API_KEY`: private server-side secret. Configure through the hosting secret manager or a private local environment; do not commit it or expose it in logs.
- `GEMINI_MODEL`: defaults to `gemini-3.8-flash`.
- `AI_DAILY_LIMIT`: maximum upstream attempts per UTC day, defaults to `100`. A nonpositive value blocks all attempts. Failed attempts count too.
- `QUOTA_DB_PATH`: `/app/runtime/quota.sqlite3` in Docker; defaults to `runtime/quota.sqlite3` for local Python execution, relative to the server's working directory.
- `CORS_ORIGINS`: comma-separated exact frontend origins. Use HTTPS production origins and omit local origins for the deployed site.

The quota counts requests, not currency. Provider/account spending controls should reflect the intended allowance. At the reverse proxy, configure a small request-body limit (for example 16 KiB) and per-client rate limiting on `/api/brief/parse`; the application itself validates brief length at 2,000 characters. Per-client throttling is a hosting configuration step, not an implemented application feature.

## Release steps

1. Choose a host supporting the topology above, persistent storage, and HTTPS. Set the frontend and backend domains and a modest resource allocation.
2. Build the API using `api/Dockerfile`, with repository root as its build context. Build the frontend using `frontend/Dockerfile`, setting `NEXT_PUBLIC_API_BASE_URL` to the backend's public HTTPS origin as a build argument.
3. Attach the persistent writable volume to the backend's `/app/runtime`. Set CORS and other non-secret configuration. Start with `AI_ENABLED=false` and configure the private key only on the backend.
4. Publish both containers. Verify backend `/api/health`, load the frontend without a login, try sample filters, compare three properties, and check Analytics. Confirm the actual browser requests go to the intended HTTPS backend.
5. For an authorized live-provider check, enable AI and test a small set of briefs, missing fields, unsupported constraints, and hard-budget wording. Confirm editable output and manual fallback; record real findings before claiming live Gemini reliability.
6. Verify rate limits, persistent quota state, and HTTPS in the real host. Record the public URL in the README and verification document only after it works.

Local development/browser tests do not establish public reachability, production HTTPS, or successful requests to a live Gemini model.

## Local production verification

`docker compose config --quiet` validates the Compose file without printing interpolated secrets. `docker compose build` builds the two images locally. `docker compose up` starts the local stack; confirm ports 3000 and 8000 are available first and avoid disturbing an unrelated service occupying them.

The API image contains only demo dependencies and the cleaned CSV, with legacy prediction available only if its additional dependencies and model artifacts are deliberately supplied later. Neither image requires an API key at build time, and the frontend image must not contain one. Nested dependency caches, local build outputs, test artifacts, environment files, and quota data are excluded from the Docker build context.

## Rollback

Redeploy the previous known-good frontend/backend image pair, restoring its corresponding frontend API origin and CORS configuration while preserving the quota volume. If AI behavior or quota enforcement is uncertain, disable `AI_ENABLED` first; matching and analytics remain usable. This workflow does not edit the source CSV or require a data migration.
