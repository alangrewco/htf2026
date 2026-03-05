# MVP API Contract v1 (Agent-Orchestrated, ACME Inc.)

## Summary
Keep the same core MVP features (ingest -> enrich -> escalate -> propose -> manager decision), but make the agent fully orchestrate ingestion, enrichment, and escalation.  
API is read-heavy for monitoring plus decision endpoints for proposals.  
No auth, single tenant, no true autonomous execution.

## Global Conventions
1. Base path: `/api/v1`
2. Content type: `application/json`
3. Time: ISO-8601 UTC
4. IDs: UUID strings
5. Polling: list/detail endpoints every `10-20s`
6. Error envelope:
```json
{
  "error": {
    "code": "INVALID_ARGUMENT",
    "message": "human readable",
    "details": {}
  }
}
```

## Core Domain Types

### Article
```json
{
  "id": "uuid",
  "source": "string",
  "source_url": "string",
  "headline": "string",
  "body": "string",
  "published_at": "datetime",
  "ingestion_run_id": "uuid",
  "processing_state": "raw|enriched|irrelevant|evaluated|proposal_generated",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Enrichment
```json
{
  "article_id": "uuid",
  "is_relevant": true,
  "relevance_tags": ["sku", "shipment", "weather"],
  "horizon": "short_term|long_term",
  "geo": {
    "countries": ["MX"],
    "ports": ["port_id"],
    "route_ids": ["route_id"],
    "lat": 19.43,
    "lng": -99.13
  },
  "impact_window": {
    "start_at": "datetime",
    "end_at": "datetime",
    "confidence": 0.82
  },
  "matched_entities": {
    "sku_ids": ["sku_id"],
    "supplier_ids": ["supplier_id"]
  },
  "risk_score": 78,
  "risk_level": "low|medium|high",
  "explanation": "string"
}
```

### Incident
```json
{
  "id": "uuid",
  "article_id": "uuid",
  "classification": "risk_exposure|active_disruption",
  "status": "open|monitoring|awaiting_decision|resolved|dismissed",
  "reasoning": "string",
  "overlap_tags": ["port_overlap", "immediate_sku_threat"],
  "risk_score": 78,
  "risk_level": "high",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### ActionProposal
```json
{
  "id": "uuid",
  "incident_id": "uuid",
  "title": "string",
  "summary": "string",
  "overall_risk": "low|medium|high",
  "estimated_impact": "string",
  "status": "proposed|approved|rejected|partially_approved|executed_manual",
  "autonomy_eligibility": {
    "auto_eligible": false,
    "reason": "risk_above_company_threshold|blocked_category|autonomy_disabled|eligible"
  },
  "steps": [
    {
      "id": "uuid",
      "step_type": "autonomous|semi_autonomous|manual",
      "category": "email|documentation|supplier_change|shipment_reroute|other",
      "description": "string",
      "requires_human_review": true,
      "suggested_payload": {}
    }
  ],
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

## Public API Contract

### Sku
```json
{
  "id": "string",
  "sku_code": "string",
  "name": "string",
  "description": "string",
  "unit_of_measure": "string",
  "status": "active|inactive",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Supplier
```json
{
  "id": "string",
  "supplier_code": "string",
  "name": "string",
  "country": "string",
  "contact_email": "string",
  "status": "active|inactive",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Shipment
```json
{
  "id": "string",
  "shipment_code": "string",
  "status": "planned|in_transit|delayed|delivered|cancelled",
  "origin_port_id": "string",
  "destination_port_id": "string",
  "route_id": "string",
  "supplier_id": "string",
  "sku_ids": ["string"],
  "eta": "datetime",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### 1) Reference Data APIs (mock ACME KB)
1. `GET /reference/skus`
2. `POST /reference/skus`
3. `PATCH /reference/skus/{sku_id}`
4. `GET /reference/suppliers`
5. `POST /reference/suppliers`
6. `PATCH /reference/suppliers/{supplier_id}`
7. `GET /reference/shipments`
8. `POST /reference/shipments`
9. `PATCH /reference/shipments/{shipment_id}`
10. `GET /reference/ports`
11. `GET /reference/routes`
12. Response:
```json
{ "items": [ ... ], "total": 123 }
```

### 2) Agent-Orchestrated Ingestion APIs
1. `POST /ingestion/runs`
2. Purpose: optional manual kick-off for demo/admin; agent still owns processing pipeline.
3. Request:
```json
{
  "max_articles": 100
}
```
4. Response `202`:
```json
{ "run_id": "uuid", "status": "queued" }
```
5. `GET /ingestion/runs/{run_id}`
6. `GET /ingestion/status` (last run + next scheduled run metadata)

### 3) Article + Enrichment Read APIs
1. `GET /articles?state=&relevant=&page=&page_size=`
2. `GET /articles/{article_id}`
3. `GET /articles/{article_id}/enrichment`

Behavior:
1. Agent performs enrichment automatically after ingestion.
2. Frontend uses these endpoints to inspect evidence and enrichment output.
3. No manual enrichment endpoint in MVP.

### 4) Escalation Read APIs (agent-owned evaluation)
1. `GET /incidents?status=&classification=&risk_level=&page=&page_size=`
2. `GET /incidents/{incident_id}`

Behavior:
1. Agent evaluates relevant articles against ACME KB (SKU/supplier/shipment/port/route).
2. If irrelevant, article becomes `irrelevant` and no incident is created.
3. If relevant, incident is created/updated as `risk_exposure` or `active_disruption` based on `overlap_tags`.
4. No manual evaluate endpoint in MVP.

### 5) Proposal APIs
1. `POST /incidents/{incident_id}/proposals:generate`
2. Response:
```json
{ "incident_id": "uuid", "proposal_ids": ["uuid", "uuid"] }
```
3. `GET /incidents/{incident_id}/proposals`
4. `GET /proposals/{proposal_id}`
5. `POST /proposals/{proposal_id}/decision`
6. Request:
```json
{
  "decision": "approve|reject|partial_approve",
  "approved_step_ids": ["uuid"],
  "manager_note": "string"
}
```

### 6) Company Settings + Soft Risk Profile APIs
1. `GET /company/profile`
2. `PUT /company/profile`
3. Fields:
```json
{
  "autonomy_enabled": true,
  "max_auto_risk_level": "low",
  "disallowed_categories": ["termination", "legal_commitment"]
}
```
4. `GET /config/risk-profile`
5. `POST /feedback/proposals/{proposal_id}`
6. Feedback request:
```json
{
  "accepted": true,
  "override_reason": "too_risky|too_conservative|other",
  "notes": "string"
}
```
7. Soft profile:
```json
{
  "manager_risk_tolerance_score": 0.42,
  "last_updated_at": "datetime"
}
```

## End-to-End Flow Mapping
1. Agent orchestrates ingestion run.
2. Agent enriches each article (relevance, geo, time window, risk).
3. Agent escalates relevant articles into incidents using ACME KB.
4. Proposals are generated per incident.
5. Manager reviews and decides.
6. Incident/proposal statuses are updated for tracking.

## State Machines
1. Article: `raw -> enriched -> irrelevant|evaluated -> proposal_generated`
2. Incident: `open -> awaiting_decision -> monitoring|resolved|dismissed`
3. Proposal: `proposed -> approved|rejected|partially_approved -> executed_manual`

## Tests and Acceptance Scenarios
1. Ingestion run transitions `queued -> running -> completed`.
2. Enrichment marks irrelevant article and no incident is created.
3. Route/port/SKU overlap creates `active_disruption`.
4. Non-immediate threat creates `risk_exposure`.
5. Proposal generation returns at least 2 distinct proposals.
6. Company profile changes autonomy eligibility outcome (`auto_eligible` + reason).
7. Partial approval preserves approved subset and updates statuses.
8. Feedback updates soft risk profile and affects later recommendation labels.
9. Polling endpoints return stable pagination and deterministic sort.
10. Invalid IDs/enums return structured error envelope.
11. `POST /reference/skus` creates SKU and returns created record.
12. `PATCH /reference/skus/{sku_id}` updates partial fields and returns updated record.
13. `POST /reference/suppliers` creates supplier and enforces unique `supplier_code`.
14. `PATCH /reference/suppliers/{supplier_id}` returns `404` for missing record.
15. `GET /reference/shipments` returns shipment list for ACME.
16. `POST /reference/shipments` creates shipment linked to supplier/ports/route.
17. `PATCH /reference/shipments/{shipment_id}` updates status/eta fields.

## Assumptions and Defaults
1. Single tenant: ACME Inc.
2. Mock seed data for SKUs/suppliers/shipments/ports/routes.
3. No auth in MVP.
4. No true autonomous execution; autonomy is metadata/eligibility only.
5. Google ADK handles orchestration internally; API exposes resources and outcomes.
6. Scheduler exists; optional `POST /ingestion/runs` is retained for demo/admin forcing.
</proposed_plan>
