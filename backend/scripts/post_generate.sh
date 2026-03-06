#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
GEN_DIR="$ROOT_DIR/generated/flask-server"
CONTROLLER_TEMPLATE="$ROOT_DIR/app/templates/reference_controller.py"
CONTROLLER_TARGET="$GEN_DIR/openapi_server/controllers/reference_controller.py"
COMPANY_CONFIG_CONTROLLER_TEMPLATE="$ROOT_DIR/app/templates/company_config_controller.py"
COMPANY_CONFIG_CONTROLLER_TARGET="$GEN_DIR/openapi_server/controllers/company_config_controller.py"
INGESTION_CONTROLLER_TEMPLATE="$ROOT_DIR/app/templates/ingestion_controller.py"
INGESTION_CONTROLLER_TARGET="$GEN_DIR/openapi_server/controllers/ingestion_controller.py"
ARTICLES_CONTROLLER_TEMPLATE="$ROOT_DIR/app/templates/articles_controller.py"
ARTICLES_CONTROLLER_TARGET="$GEN_DIR/openapi_server/controllers/articles_controller.py"
INCIDENTS_CONTROLLER_TEMPLATE="$ROOT_DIR/app/templates/incidents_controller.py"
INCIDENTS_CONTROLLER_TARGET="$GEN_DIR/openapi_server/controllers/incidents_controller.py"
TEST_TEMPLATE_DIR="$ROOT_DIR/app/templates/generated_tests"
TEST_TARGET_DIR="$GEN_DIR/openapi_server/test"
REQ_FILE="$GEN_DIR/requirements.txt"
ROOT_ENV_FILE="$ROOT_DIR/.env"
GEN_ENV_FILE="$GEN_DIR/.env"

cp "$CONTROLLER_TEMPLATE" "$CONTROLLER_TARGET"
cp "$COMPANY_CONFIG_CONTROLLER_TEMPLATE" "$COMPANY_CONFIG_CONTROLLER_TARGET"
cp "$INGESTION_CONTROLLER_TEMPLATE" "$INGESTION_CONTROLLER_TARGET"
cp "$ARTICLES_CONTROLLER_TEMPLATE" "$ARTICLES_CONTROLLER_TARGET"
cp "$INCIDENTS_CONTROLLER_TEMPLATE" "$INCIDENTS_CONTROLLER_TARGET"

if ! grep -q '^SQLAlchemy' "$REQ_FILE"; then
  printf '\nSQLAlchemy >= 2.0.0\n' >> "$REQ_FILE"
fi

if ! grep -q '^psycopg2-binary' "$REQ_FILE"; then
  printf 'psycopg2-binary >= 2.9.0\n' >> "$REQ_FILE"
fi

if ! grep -qi '^flask-cors' "$REQ_FILE"; then
  printf 'flask-cors >= 4.0.0\n' >> "$REQ_FILE"
fi

if [[ -f "$ROOT_ENV_FILE" ]]; then
  cp "$ROOT_ENV_FILE" "$GEN_ENV_FILE"
fi

if [[ -d "$TEST_TEMPLATE_DIR" ]]; then
  cp "$TEST_TEMPLATE_DIR"/test_*_controller.py "$TEST_TARGET_DIR"/
fi
