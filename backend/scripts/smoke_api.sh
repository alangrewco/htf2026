#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://127.0.0.1:8080}"
API_BASE="${BASE_URL%/}/api/v1"

echo "Checking: ${API_BASE}/reference/ports"
curl -fsS "${API_BASE}/reference/ports" >/dev/null

echo "Checking: ${API_BASE}/articles?page=1&page_size=1"
curl -fsS "${API_BASE}/articles?page=1&page_size=1" >/dev/null

echo "Checking: ${API_BASE}/ingestion/status"
curl -fsS "${API_BASE}/ingestion/status" >/dev/null

echo "Smoke test passed for ${BASE_URL}"
