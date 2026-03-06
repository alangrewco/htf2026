# Enrichment Implementation

This document summarizes what was implemented for enrichment APIs and enrichment processing.

## Endpoints Implemented
- `GET /api/v1/articles`
- `GET /api/v1/articles/{article_id}`
- `GET /api/v1/articles/{article_id}/enrichment`

## Processing Model
- Enrichment is asynchronous and separate from ingestion transaction writes.
- Each newly ingested article is queued for enrichment in `article_enrichment_jobs`.
- A dispatcher loop continuously picks ready jobs.
- Each job is processed by its own worker thread (non-sequential processing).

## ADK/Gemini Integration
- Enrichment agent supports:
  - `ENRICHMENT_PROVIDER=mock`
  - `ENRICHMENT_PROVIDER=gemini`
- Gemini calls go through the Google Generative Language API using configured model.
- Enrichment output is validated before persistence:
  - `relevance_tags`: `sku|shipment|supplier|weather|geopolitical|financial`
  - `horizon`: `short_term|long_term`
  - `risk_level`: `low|medium|high`
- Article transitions:
  - relevant => `processing_state=enriched`
  - not relevant => `processing_state=irrelevant`

## Cost Control and Quota
- Global model-call cap enforced via `enrichment_quota` table.
- Cap env var:
  - `ENRICHMENT_MAX_ARTICLES_TOTAL`
- When cap is reached:
  - job remains queued
  - `last_error=max_enrichment_cap_reached`
  - `next_retry_at` is set for later re-dispatch

## Retry and Failure Behavior
- Retries are supported for failed enrichments:
  - `ENRICHMENT_MAX_RETRIES`
  - `ENRICHMENT_RETRY_BACKOFF_SECONDS` (exponential backoff)
- Article failure diagnostics are persisted:
  - `enrichment_failed`
  - `enrichment_failed_at`
  - `enrichment_error`
  - `enrichment_attempt_count`

## Schema Upgrade Handling
- Startup bootstrap applies non-destructive schema upgrades for missing enrichment columns on existing DBs.
- This prevents runtime failures when code is newer than existing table schema.

## Files Added/Updated (Enrichment)
- `app/services/enrichment_service.py`
- `app/adk/enrichment_agent.py`
- `app/repositories/enrichment_repo.py`
- `app/services/article_service.py`
- `generated/flask-server/openapi_server/controllers/articles_controller.py`
- `generated/flask-server/openapi_server/test/test_articles_controller.py`
- `app/templates/articles_controller.py`
- `app/templates/generated_tests/test_articles_controller.py`
- `scripts/clear_article_enrichment.sh`
- `app/models.py`
- `app/bootstrap.py`

## Runtime Configuration
- `ENRICHMENT_PROVIDER=mock|gemini`
- `GOOGLE_API_KEY`
- `GEMINI_MODEL`
- `ENRICHMENT_WORKER_ENABLED`
- `ENRICHMENT_DISPATCHER_INTERVAL_SEC`
- `ENRICHMENT_MAX_CONCURRENCY`
- `ENRICHMENT_MAX_RETRIES`
- `ENRICHMENT_RETRY_BACKOFF_SECONDS`
- `ENRICHMENT_MAX_ARTICLES_TOTAL`
