# Ingestion Implementation

This document summarizes what was implemented for the `/api/v1/ingestion/*` APIs.

## Endpoints Implemented
- `POST /api/v1/ingestion/runs`
- `GET /api/v1/ingestion/runs/{run_id}`
- `GET /api/v1/ingestion/status`

## Core Behavior
- Ingestion runs are created in `queued` state, then processed asynchronously in a worker thread.
- Run lifecycle: `queued -> running -> completed|failed`.
- Status fields (`articles_ingested`, `articles_relevant`, `incidents_created`, `proposals_generated`) are persisted per run.
- Scheduler metadata is exposed by `GET /ingestion/status`.
- Optional polling scheduler can be disabled with `INGESTION_POLLING_DISABLED=true`.

## Source Providers
- `mock` mode for deterministic local/test ingestion.
- `live` mode with multiple free providers:
  - GDELT
  - Guardian (if API key configured)
  - NOAA Alerts
  - USGS Earthquakes

## Deduping and Persistence
- Candidate dedupe is done before insert.
- Database dedupe is enforced by checking:
  - `(source, source_url)`
  - `content_hash`
- Inserted rows go to `articles` with initial `processing_state=raw`.

## Partial Failure Policy
- Source-level errors are captured in run `error`.
- If at least one source ingests data, run is marked `completed` (non-fatal partial failure).
- Run is marked `failed` only when errors occur and `articles_ingested == 0`.

## GDELT Rate Limiting and Retry
- GDELT uses `HTTP_USER_AGENT` from env (fallback to browser-style default).
- On HTTP `429`:
  - retries (`GDELT_MAX_RETRIES`)
  - backoff (`GDELT_RETRY_BACKOFF_SECONDS`)
  - cooldown skip (`GDELT_429_COOLDOWN_SECONDS`)
- During cooldown, GDELT source returns no items and does not crash the full run.

## Files Added/Updated (Ingestion)
- `app/services/ingestion_service.py`
- `app/repositories/ingestion_repo.py`
- `app/repositories/article_repo.py`
- `app/ingestion/*`
- `generated/flask-server/openapi_server/controllers/ingestion_controller.py`
- `generated/flask-server/openapi_server/test/test_ingestion_controller.py`
- `app/templates/ingestion_controller.py`
- `app/templates/generated_tests/test_ingestion_controller.py`
- `app/tests/test_ingestion_service.py`
- `scripts/reset_ingestion_data.sh`

## Runtime Configuration
- `INGESTION_SOURCE_MODE=mock|live`
- `INGESTION_POLLING_DISABLED=true|false`
- `INGESTION_SCHEDULER_INTERVAL_MIN`
- `INGESTION_SCHEDULED_MAX_ARTICLES`
- `INGESTION_ENABLE_GDELT|GUARDIAN|NOAA|USGS`
- `INGESTION_REGION_FOCUS`
- `INGESTION_NOAA_AREAS`
- `INGESTION_NEWS_QUERY`
- `GUARDIAN_API_KEY`
- `HTTP_USER_AGENT`
- `GDELT_MAX_RETRIES`
- `GDELT_RETRY_BACKOFF_SECONDS`
- `GDELT_429_COOLDOWN_SECONDS`
