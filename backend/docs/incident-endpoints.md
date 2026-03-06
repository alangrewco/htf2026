# Incident Endpoints Documentation

This document describes how incident APIs work in the backend.

## Endpoints
- `GET /api/v1/incidents`
- `GET /api/v1/incidents/{incident_id}`

## Data Source
- Incidents are persisted in the `incidents` table.
- Incidents are created/updated automatically from relevant enriched articles.
- One incident maps to one article (`article_id` is unique in incidents).

## Classification
Incidents use:
- `classification`: `risk_exposure | active_disruption`
- `overlap_tags`: `port_overlap | route_overlap | immediate_sku_threat`

Rule intent:
- `active_disruption` when article impact overlaps ACME ports/routes or is an immediate SKU threat.
- Otherwise `risk_exposure`.

## Status
Current default on creation:
- `open`

Other allowed statuses (contract-level):
- `open | monitoring | awaiting_decision | resolved | dismissed`

## Response Shape
Each incident includes:
- `id`
- `article_id`
- `classification`
- `status`
- `reasoning`
- `overlap_tags`
- `risk_score` (0-100)
- `risk_level` (`low|medium|high`)
- `created_at`
- `updated_at`

## List Filters
`GET /incidents` supports:
- `status`
- `classification`
- `risk_level`
- `page`
- `page_size`

Sorting:
- deterministic by `updated_at desc`

## Error Behavior
Errors follow the standard envelope:
```json
{
  "error": {
    "code": "STRING_CODE",
    "message": "Human readable",
    "details": {}
  }
}
```

Common statuses:
- `400` bad query params
- `404` incident not found
- `500` unexpected/internal error

## Internal Components
- Controller:
  - `generated/flask-server/openapi_server/controllers/incidents_controller.py`
- Service:
  - `app/services/incident_service.py`
- Repository:
  - `app/repositories/incident_repo.py`
- Agent:
  - `app/adk/incident_agent.py`

## Regeneration Safety
- Template controller is stored at:
  - `app/templates/incidents_controller.py`
- `scripts/post_generate.sh` copies this template into generated server after OpenAPI regeneration.
