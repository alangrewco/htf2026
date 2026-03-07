# OpenAPI Spec Documentation

## Source of truth
- Spec file: `backend/openapi.yaml`
- Generated server copy: `backend/generated/flask-server/openapi_server/openapi/openapi.yaml`

## Base settings
- OpenAPI version: `3.0.3`
- Base URL: `/api/v1`
- Format: `application/json`

## Validation and generation
```bash
cd backend
make generate-server
```

What this does:
1. Validates `openapi.yaml`
2. Regenerates Flask server into `generated/flask-server`
3. Reapplies custom reference-controller patch via `scripts/post_generate.sh`

## Swagger UI
Run generated server (loads shared `backend/.env` automatically):
```bash
cd backend
./scripts/run_generated_server.sh
```

Open:
- Swagger UI: `http://localhost:8080/api/v1/ui/`
- OpenAPI JSON: `http://localhost:8080/api/v1/openapi.json`

## Error format
All API errors use:
```json
{
  "error": {
    "code": "STRING_CODE",
    "message": "Human readable",
    "details": {}
  }
}
```
