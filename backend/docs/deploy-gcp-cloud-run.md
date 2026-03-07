# GCP Deployment (Cloud Run)

This backend can be deployed on Google Cloud Run with one command.

## Why this setup
- Fastest path for hackathon use.
- Single Cloud Run instance (`min=1`, `max=1`) so background enrichment thread keeps running.
- No backend API contract changes.

## Prerequisites
- `gcloud` CLI installed and logged in.
- Billing-enabled GCP project.
- Cloud Run + Cloud Build APIs enabled:
  - `run.googleapis.com`
  - `cloudbuild.googleapis.com`

## One-time project setup
```bash
gcloud config set project <YOUR_PROJECT_ID>
gcloud services enable run.googleapis.com cloudbuild.googleapis.com
```

## Deploy
From `backend/`:

```bash
chmod +x scripts/deploy_cloud_run.sh
GCP_PROJECT_ID=<YOUR_PROJECT_ID> GCP_REGION=us-central1 CLOUD_RUN_SERVICE=htf2026-backend ./scripts/deploy_cloud_run.sh
```

The script:
- Reads `backend/.env`
- Converts values to a temporary Cloud Run env-yaml
- Forces `PORT=8080` for Cloud Run compatibility
- Deploys from `backend/` using `backend/Dockerfile`
- Container includes both `generated/flask-server` and `app` modules
- Prints final service URL

## Frontend wiring
Use:

`https://<cloud-run-url>/api/v1`

Example:
- Articles list: `/api/v1/articles?page=1&page_size=20`
- Swagger UI: `/api/v1/ui/`

## Smoke test
```bash
./scripts/smoke_api.sh https://<cloud-run-url>
```

## GitHub CI/CD (tests -> deploy)
Workflow file:

`/.github/workflows/backend-ci-cd.yml`

Behavior:
- On push to `main` (backend paths), runs backend tests.
- If tests pass, deploys to Cloud Run.

Required GitHub repository secrets:
- `GCP_SA_KEY`: service account JSON key with Cloud Run deploy permissions.
- `GCP_PROJECT_ID`: target project id (example: `gen-lang-client-0168796572`).
- `GCP_REGION`: Cloud Run region (example: `us-central1`).
- `CLOUD_RUN_SERVICE`: service name (example: `htf2026-backend`).
- `BACKEND_ENV_FILE`: full contents of `backend/.env` as multi-line secret.

## Notes
- Current architecture uses an in-process enrichment worker thread.
- For this 3-day hackathon, single-instance Cloud Run is acceptable.
- For long-term reliability, move enrichment jobs to Cloud Tasks/PubSub worker architecture.
