#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"
SOURCE_DIR="$ROOT_DIR/generated/flask-server"

if ! command -v gcloud >/dev/null 2>&1; then
  echo "gcloud CLI not found. Install Google Cloud SDK first."
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE"
  exit 1
fi

if [[ ! -d "$SOURCE_DIR" ]]; then
  echo "Missing source directory: $SOURCE_DIR"
  exit 1
fi

if [[ ! -f "$ROOT_DIR/Dockerfile" ]]; then
  echo "Missing Dockerfile: $ROOT_DIR/Dockerfile"
  exit 1
fi

: "${GCP_PROJECT_ID:?Set GCP_PROJECT_ID in your shell first.}"
GCP_REGION="${GCP_REGION:-us-central1}"
CLOUD_RUN_SERVICE="${CLOUD_RUN_SERVICE:-htf2026-backend}"

if ! gcloud auth list --filter=status:ACTIVE --format='value(account)' | grep -q .; then
  echo "No active gcloud account. Run: gcloud auth login"
  exit 1
fi

TMP_ENV_YAML="$(mktemp /tmp/cloudrun-env-XXXXXX.yaml)"
cleanup() {
  rm -f "$TMP_ENV_YAML"
}
trap cleanup EXIT

python3 - <<'PY' "$ENV_FILE" "$TMP_ENV_YAML"
import sys
from pathlib import Path

env_path = Path(sys.argv[1])
out_path = Path(sys.argv[2])

env = {}
for raw_line in env_path.read_text().splitlines():
    line = raw_line.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue
    key, value = line.split("=", 1)
    key = key.strip()
    value = value.strip()
    if not key:
        continue
    env[key] = value

# Cloud Run injects PORT automatically.
env.pop("PORT", None)

# Local-only/sensitive composition keys, keep out of Cloud Run runtime.
env.pop("SUPABASE_PROJECT_REF", None)
env.pop("SUPABASE_DB_PASSWORD", None)

with out_path.open("w", encoding="utf-8") as f:
    for key in sorted(env):
        value = env[key].replace("\\", "\\\\").replace('"', '\\"')
        f.write(f'{key}: "{value}"\n')
PY

echo "Deploying ${CLOUD_RUN_SERVICE} to project=${GCP_PROJECT_ID}, region=${GCP_REGION}"
gcloud run deploy "$CLOUD_RUN_SERVICE" \
  --project "$GCP_PROJECT_ID" \
  --region "$GCP_REGION" \
  --source "$ROOT_DIR" \
  --quiet \
  --allow-unauthenticated \
  --min-instances 1 \
  --max-instances 1 \
  --port 8080 \
  --timeout 900 \
  --memory 1Gi \
  --cpu 1 \
  --env-vars-file "$TMP_ENV_YAML"

SERVICE_URL="$(gcloud run services describe "$CLOUD_RUN_SERVICE" --project "$GCP_PROJECT_ID" --region "$GCP_REGION" --format='value(status.url)')"
echo "Deployed URL: ${SERVICE_URL}"
echo "API base: ${SERVICE_URL}/api/v1"
