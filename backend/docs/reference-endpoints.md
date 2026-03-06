# Reference Endpoints Documentation

These endpoints manage ACME master data used by disruption logic.

## Storage
- Backed by Supabase Postgres through SQLAlchemy
- `DATABASE_URL` is required
- Tables are auto-created on startup if missing
- Default ports/routes are seeded once if empty

## SKU
- `GET /api/v1/reference/skus`
- `POST /api/v1/reference/skus`
- `PATCH /api/v1/reference/skus/{sku_id}`

Fields:
- `sku_code`, `name`, `description`, `unit_of_measure`, `status`
- `risk_score` (0-100), `risk_level` (`critical|high|medium|low`)
- `category`
- `supplier_ids[]`

Rules:
- `sku_code` must be unique (`409` on duplicate)
- `risk_score` must be between `0` and `100` (`422` otherwise)
- `risk_level` must be one of `critical|high|medium|low` (`422` otherwise)
- `PATCH` is partial update (`404` if `sku_id` not found)

## Supplier
- `GET /api/v1/reference/suppliers`
- `POST /api/v1/reference/suppliers`
- `PATCH /api/v1/reference/suppliers/{supplier_id}`

Fields:
- `supplier_code`, `name`, `country`, `contact_email`, `status`
- `region`
- `risk_rating`

Rules:
- `supplier_code` must be unique (`409` on duplicate)
- `PATCH` is partial update (`404` if `supplier_id` not found)

## Shipment
- `GET /api/v1/reference/shipments`
- `POST /api/v1/reference/shipments`
- `PATCH /api/v1/reference/shipments/{shipment_id}`

Fields:
- `shipment_code`, `status`
- `origin_port_id`, `destination_port_id`, `route_id`
- `supplier_id`, `sku_ids[]`
- `carrier`
- `order_date`, `expected_delivery_date` (ISO-8601 datetime)
- `events[]` (`id`, `type`, `description`, `event_time` required per event)

Rules:
- `shipment_code` must be unique (`409` on duplicate)
- Strict referential checks (`422` on invalid references):
  - `supplier_id` must exist
  - `origin_port_id` and `destination_port_id` must exist
  - `route_id` must exist
  - all `sku_ids` must exist
- `PATCH` is partial update (`404` if `shipment_id` not found)

## Ports and Routes (read-only)
- `GET /api/v1/reference/ports`
- `GET /api/v1/reference/routes`

## Common status codes
- `200` success
- `201` created
- `400` bad request
- `404` not found
- `409` conflict
- `422` validation error
- `500` server/config error

## Seed and Backfill Utilities
- `./scripts/seed_reference_data.sh`
: API-driven idempotent upsert of demo suppliers, SKUs, and shipments.
- `./scripts/backfill_reference_data.sh`
: Non-destructive patch of existing rows to ensure required OpenAPI fields are populated.

Both scripts:
- read `backend/.env`
- default to `API_BASE_URL=http://127.0.0.1:8080/api/v1`
- preserve existing IDs when records already exist

## Example environment variables
```bash
SUPABASE_PROJECT_REF=your-project-ref
SUPABASE_DB_PASSWORD=your-db-password
DATABASE_URL=postgresql+psycopg2://postgres.your-project-ref:your-db-password@aws-0-us-east-1.pooler.supabase.com:5432/postgres
API_BASE_URL=http://127.0.0.1:8080/api/v1
```
