# Ingestion Endpoints Documentation

## Contract
No OpenAPI contract changes were introduced.

Endpoints implemented:
- `POST /api/v1/ingestion/runs`
- `GET /api/v1/ingestion/runs/{run_id}`
- `GET /api/v1/ingestion/status`
- `GET /api/v1/articles`
- `GET /api/v1/articles/{article_id}`
- `GET /api/v1/articles/{article_id}/enrichment`

## Behavior
- Manual run (`POST /ingestion/runs`) queues immediately and starts as soon as the single worker is free.
- Single-worker execution only; no overlapping ingestion runs.
- Dedupe is applied:
  - unique by `(source, source_url)`
  - soft dedupe by content hash (source + normalized headline + publish day)
- Ingestion and enrichment are separate stages:
  - ingestion stores articles as `raw`
  - an async enrichment worker processes each article in background

## Free sources (implemented)
- GDELT DOC API
- Guardian Open Platform (free developer key if enabled)
- NOAA Weather Alerts API
- USGS Earthquake GeoJSON feed

## GDELT request headers
GDELT requests include:
- `User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36`
- `Accept: application/json,text/plain,*/*`

## Environment Variables
- `INGESTION_SOURCE_MODE`:
  - `live` (default): uses external sources
  - `mock`: deterministic local source for tests/dev
- `INGESTION_POLLING_DISABLED`:
  - `true`: disables scheduler polling, read APIs still serve existing DB data, manual runs still work
  - `false` (default): scheduler enabled
- `INGESTION_SCHEDULER_INTERVAL_MIN` (default `10`)
- `INGESTION_SCHEDULED_MAX_ARTICLES` (default `100`)
- `INGESTION_ENABLE_GDELT` (default `true`)
- `INGESTION_ENABLE_GUARDIAN` (default `true`, requires `GUARDIAN_API_KEY`)
- `INGESTION_ENABLE_NOAA` (default `true`)
- `INGESTION_ENABLE_USGS` (default `true`)
- `INGESTION_NEWS_QUERY` (default shipping/logistics disruption query)
- `INGESTION_REGION_FOCUS` (default `US,CA`)
- `INGESTION_NOAA_AREAS` (optional explicit NOAA area list, example: `CA,WA,TX`; overrides derived region values)
- `GUARDIAN_API_KEY` (optional; if missing, Guardian source is skipped)
- `ENRICHMENT_PROVIDER`:
  - `gemini` (Gemini ADK-style per-article agent call)
  - `mock` (deterministic local enrichment for tests)
- `ENRICHMENT_WORKER_ENABLED` (default `true`)
- `ENRICHMENT_MAX_CONCURRENCY` (default `0` for unbounded)
- `ENRICHMENT_MAX_RETRIES` (default `4`)
- `ENRICHMENT_RETRY_BACKOFF_SECONDS` (default `60`)
- `ENRICHMENT_DISPATCHER_INTERVAL_SEC` (default `1`)
- `ENRICHMENT_MAX_ARTICLES_TOTAL` (default `200`, hard cap on enrichment model calls to control test costs)

## Regen-safe notes
- Business logic lives in `app/*`.
- Generated controllers are overwritten from templates by `scripts/post_generate.sh`.
- Run `make generate-server` safely; custom ingestion logic is reapplied automatically.
