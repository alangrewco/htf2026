# Maritime Risk Feed Demo Backend (Flask)

Single-tenant demo backend for a Bloomberg-terminal-like maritime supply-chain risk feed and planning agent (Asia <-> USA).

## Stack

- Flask + flask-smorest (Swagger UI docs)
- SQLite + SQLAlchemy
- APScheduler background jobs
- SSE streaming
- Google ADK wrapper for research enrichment
- pytest + requests-mock for deterministic offline tests

## Run locally

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python seed.py
python app.py
```

Note: `app.py` runs with Flask debug mode but reloader disabled so startup seeding happens once per launch.

On app startup, the backend now:
- resets live/dynamic tables (`risk_events`, research/recommendation tables)
- seeds fresh live events from:
  - Open-Meteo Marine with `forecast_days=7`
  - GDELT main query, then a maritime/logistics follow-up query after 10 seconds
- if GDELT startup call fails (for example 429), falls back to free RSS feeds
- prints a log line like: `seeding complete: weather_created=... news_created=... total=... source=gdelt|rss`

Docs URLs:

- http://localhost:5001/swagger-ui

## How to run tests

```bash
cd backend
pytest -q
```

## Environment variables

The project now reads `backend/.env` automatically on startup.

Important keys:

- `GOOGLE_API_KEY` (or `GEMINI_API_KEY`) for live ADK/Gemini enrichment
- `DATABASE_URL` for SQLite/DB override
- `PORT` (defaults to `5001`)
- `GDELT_MAIN_QUERY`, `GDELT_MAIN_MAX_RECORDS`, `GDELT_FOLLOWUP_QUERY`, `GDELT_FOLLOWUP_MAX_RECORDS`, `GDELT_FOLLOWUP_DELAY_SECONDS`
- `GDELT_STARTUP_QUERY`, `GDELT_STARTUP_MAX_RECORDS`, `GDELT_POLL_MAX_RECORDS`, `GDELT_READ_TIMEOUT_SECONDS`, `GDELT_429_COOLDOWN_SECONDS`
- `HTTP_USER_AGENT` (used for GDELT/RSS requests to reduce bot-block/403 behavior)
- `RSS_FALLBACK_ENABLED`, `RSS_FEEDS`
- `ENRICHMENT_MAX_WORKERS` (default `50`)
- `ENRICHMENT_BATCH_SIZE` (default `200`)
- `ENRICHMENT_MAX_BATCH_LOOPS` (default `5`)

## See live events right now

Background polling runs every 10-15 minutes by default. To force events immediately:

```bash
cd backend
source .venv/bin/activate
python poll_live.py
```

Optional:

```bash
python poll_live.py --source weather
python poll_live.py --source news
python poll_live.py --no-demo-fallback
```

`poll_live.py` is optimized for interactive demo use:
- it runs one targeted news query with up to 50 records
- if live polling creates 0 rows, it inserts one local demo event so SSE is easy to verify immediately

Then watch the feed:

```bash
curl -N http://localhost:5001/api/stream/events
```

## SSE client example

```html
<script>
  // backfill=20 sends recent events first, then live events continue.
  const es = new EventSource('http://localhost:5001/api/stream/events?min_severity=50&backfill=20&backfill_order=desc');
  es.addEventListener('risk_event', (e) => {
    const data = JSON.parse(e.data);
    // data.stream_phase is "backfill" or "live"
    console.log('risk_event', data);
  });
</script>
```

## Example curl commands

```bash
curl http://localhost:5001/api/health
curl 'http://localhost:5001/api/events?type=NEWS&min_severity=50&limit=100'
curl http://localhost:5001/api/events/summary
curl http://localhost:5001/api/shipments/1/risks

curl -X POST http://localhost:5001/api/recommendations/generate \
  -H 'Content-Type: application/json' \
  -d '{"profile":"resilient","sku_ids":[1,2],"horizon_days":30}'

curl -X PUT http://localhost:5001/api/preferences \
  -H 'Content-Type: application/json' \
  -d '{"profile":"resilient","w_cost":0.3,"w_speed":0.2,"w_risk":0.5,"blocked_ports":["USLAX"],"preferred_carriers":[1]}'

curl -X POST http://localhost:5001/api/research/tasks \
  -H 'Content-Type: application/json' \
  -d '{"event_id":1,"mode":"enrich"}'

curl -X POST http://localhost:5001/api/research/tasks/bulk \
  -H 'Content-Type: application/json' \
  -d '{}'

curl http://localhost:5001/api/research/progress
curl -N 'http://localhost:5001/api/research/stream/progress?interval_seconds=1'
```

## End-to-End Bulk Enrichment Flow (Runbook)

### Summary

This runbook lets you:

1. enqueue bulk research tasks,
2. watch enrichment progress live,
3. inspect findings and enriched events,
4. validate shipment impact,
5. generate recommendations and apply feedback.

### Step-by-step (copy/paste)

1. Start backend

```bash
cd /Users/bhavjotg/Documents/projects/htf2026/backend
source .venv/bin/activate
python app.py
```

2. Health check

```bash
curl http://localhost:5001/api/health
```

3. See available NEWS events (optional sanity check)

```bash
curl 'http://localhost:5001/api/events?type=NEWS&limit=20'
```

4. Bulk enqueue research (default = all unenriched NEWS)

```bash
curl -X POST http://localhost:5001/api/research/tasks/bulk \
  -H 'Content-Type: application/json' \
  -d '{}'
```

5. Watch progress live

```bash
curl -N "http://localhost:5001/api/research/stream/progress?interval_seconds=1"
```

What to expect:

- queued decreases
- running fluctuates
- done increases
- failed should stay low

6. Snapshot progress (optional)

```bash
curl http://localhost:5001/api/research/progress
```

7. Get findings after tasks complete

```bash
curl "http://localhost:5001/api/research/findings"
```

For one event:

```bash
curl "http://localhost:5001/api/research/findings?event_id=118"
```

8. Confirm event got enriched

```bash
curl "http://localhost:5001/api/events/118"
```

Look for updated summary, severity, confidence, impacted_*, time window.

9. Watch terminal risk feed (backfill + live)

```bash
curl -N "http://localhost:5001/api/stream/events?backfill=50&backfill_order=desc&min_severity=0"
```

10. Check shipment risk linkage after enrichment

```bash
curl http://localhost:5001/api/shipments
curl http://localhost:5001/api/shipments/1/risks
```

11. Generate recommendations

```bash
curl -X POST http://localhost:5001/api/recommendations/generate \
  -H 'Content-Type: application/json' \
  -d '{"profile":"resilient","sku_ids":[1,2,3,4],"horizon_days":30}'
```

12. Inspect one recommendation

```bash
curl http://localhost:5001/api/recommendations/1
```

13. Send feedback (preference learning)

```bash
curl -X POST http://localhost:5001/api/recommendations/1/feedback \
  -H 'Content-Type: application/json' \
  -d '{"accepted":false,"reason_code":"too_expensive"}'
```

14. Verify updated preferences

```bash
curl http://localhost:5001/api/preferences
```

15. Regenerate and compare

```bash
curl -X POST http://localhost:5001/api/recommendations/generate \
  -H 'Content-Type: application/json' \
  -d '{"profile":"resilient","sku_ids":[1,2,3,4],"horizon_days":30}'
```

## Important API contracts used

- POST /api/research/tasks/bulk (bulk enqueue)
- GET /api/research/stream/progress (live progress)
- GET /api/research/findings
- GET /api/events/<id>
- GET /api/shipments/<id>/risks
- POST /api/recommendations/generate
- POST /api/recommendations/<id>/feedback
- GET /api/preferences

## Test/acceptance checkpoints

- Bulk enqueue response has non-zero created_count.
- Progress stream reaches queued=0 and running=0.
- Findings exist for targeted event IDs.
- Enriched event fields are updated.
- Recommendation generation returns deterministic structure + weights.
- Feedback updates weights; second generation reflects changed weights.

## Assumptions/defaults

- Server runs on http://localhost:5001.
- Scheduler is enabled (research processor runs every 1 minute).
- Bulk defaults to unenriched NEWS when body is {}.

## Background jobs

- `poll_weather()` every 15 minutes (Open-Meteo Marine API)
- `poll_gdelt()` every 10 minutes (main query + maritime/logistics follow-up after 10s)
- `process_research_tasks()` every 1 minute (ADK enrichment)

## Notes

- `risk_events.dedupe_key` enforces deduplication.
- GDELT deduplication is title-based (normalized title hash), so syndicated duplicates collapse.
- External calls are mocked in tests; tests are offline and deterministic.
- ADK wrapper returns strict JSON and updates/stores findings in DB.
