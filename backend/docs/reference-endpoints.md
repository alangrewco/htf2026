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

Rules:
- `sku_code` must be unique (`409` on duplicate)
- `PATCH` is partial update (`404` if `sku_id` not found)

## Supplier
- `GET /api/v1/reference/suppliers`
- `POST /api/v1/reference/suppliers`
- `PATCH /api/v1/reference/suppliers/{supplier_id}`

Rules:
- `supplier_code` must be unique (`409` on duplicate)
- `PATCH` is partial update (`404` if `supplier_id` not found)

## Shipment
- `GET /api/v1/reference/shipments`
- `POST /api/v1/reference/shipments`
- `PATCH /api/v1/reference/shipments/{shipment_id}`

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

## Example environment variables
```bash
SUPABASE_PROJECT_REF=your-project-ref
SUPABASE_DB_PASSWORD=your-db-password
DATABASE_URL=postgresql+psycopg2://postgres.your-project-ref:your-db-password@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```
