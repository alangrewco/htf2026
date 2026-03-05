# Company Config Endpoints Documentation

These endpoints manage ACME policy settings that determine proposal autonomy eligibility.

## Storage
- Backed by SQLAlchemy using `DATABASE_URL`
- Tables are auto-created on startup if missing
- Defaults are seeded once if empty
  - `company_profile`: `autonomy_enabled=true`, `max_auto_risk_level=low`, `disallowed_categories=[]`
  - `risk_profile`: `manager_risk_tolerance_score=0.5`

## Endpoints
- `GET /api/v1/company/profile`
- `PUT /api/v1/company/profile`
- `GET /api/v1/config/risk-profile`

## Company Profile Fields
- `autonomy_enabled` (`boolean`)
- `max_auto_risk_level` (`low|medium|high`)
- `disallowed_categories` (`string[]`)

## Validation and Behavior
- `PUT /company/profile` requires all fields from the OpenAPI schema.
- `max_auto_risk_level` must be one of `low|medium|high`.
- `disallowed_categories` is normalized:
  - trimmed
  - empty entries rejected
  - duplicates removed while preserving first-seen order
- Invalid request payloads may be rejected at request-validation time by Connexion (`400`) before controller logic runs.

## Regen-safe implementation
- Business logic lives outside generated code:
  - `backend/app/services/company_config_service.py`
  - `backend/app/repositories/company_config_repo.py`
  - `backend/app/models.py`
- Generated controller is overwritten from template on every generation:
  - template: `backend/app/templates/company_config_controller.py`
  - hook: `backend/scripts/post_generate.sh`

## Tests
- Service tests:
  - `backend/app/tests/test_company_config_service.py`
- Generated integration tests:
  - `backend/generated/flask-server/openapi_server/test/test_company_config_controller.py`
  - copied from template on regeneration via `post_generate.sh`
