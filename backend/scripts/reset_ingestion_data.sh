#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
GEN_DIR="$ROOT_DIR/generated/flask-server"
VENV_ACTIVATE="$GEN_DIR/venv/bin/activate"
ENV_FILE="$ROOT_DIR/.env"

if [[ ! -f "$VENV_ACTIVATE" ]]; then
  echo "Missing generated server venv at: $VENV_ACTIVATE"
  echo "Create it with:"
  echo "  cd $GEN_DIR && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE"
  exit 1
fi

cd "$GEN_DIR"
source "$VENV_ACTIVATE"

# Load .env safely (supports values with spaces without requiring shell quoting)
while IFS= read -r line || [[ -n "$line" ]]; do
  # Skip blank lines and comments
  [[ -z "${line// }" ]] && continue
  [[ "${line#\#}" != "$line" ]] && continue
  # Keep only KEY=VALUE lines
  [[ "$line" != *"="* ]] && continue

  key="${line%%=*}"
  value="${line#*=}"

  # Trim whitespace around key
  key="${key#"${key%%[![:space:]]*}"}"
  key="${key%"${key##*[![:space:]]}"}"

  # Ignore invalid shell variable names
  [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue

  export "$key=$value"
done < "$ENV_FILE"

python3 - <<'PY'
import os
import sys
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.exc import SQLAlchemyError

database_url = os.getenv("DATABASE_URL", "").strip()
if not database_url:
    raise SystemExit("DATABASE_URL is not set. Add it to backend/.env or environment.")

try:
    engine = create_engine(database_url, future=True, pool_pre_ping=True)
    inspector = inspect(engine)
    existing = set(inspector.get_table_names())

    targets = [
        "article_enrichments",
        "article_enrichment_jobs",
        "incidents",
        "articles",
        "ingestion_checkpoints",
        "ingestion_runs",
        "enrichment_quota",
    ]

    deleted = []
    with engine.begin() as conn:
        for table in targets:
            if table in existing:
                conn.execute(text(f"DELETE FROM {table}"))
                deleted.append(table)

    print("Reset completed. Cleared tables:", ", ".join(deleted) if deleted else "(none found)")
except SQLAlchemyError as err:
    print(f"Failed to reset tables. Check DATABASE_URL and DB connectivity.\nError: {err}", file=sys.stderr)
    sys.exit(1)
PY
