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

# Load .env safely, but do not overwrite already-exported vars.
while IFS= read -r line || [[ -n "$line" ]]; do
  [[ -z "${line// }" ]] && continue
  [[ "${line#\#}" != "$line" ]] && continue
  [[ "$line" != *"="* ]] && continue

  key="${line%%=*}"
  value="${line#*=}"

  key="${key#"${key%%[![:space:]]*}"}"
  key="${key%"${key##*[![:space:]]}"}"
  [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue

  if [[ -z "${!key+x}" ]]; then
    export "$key=$value"
  fi
done < "$ENV_FILE"

python3 - <<'PY'
from datetime import datetime, timezone
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
    tables = set(inspector.get_table_names())

    cleared_enrichments = 0
    reset_articles = 0

    with engine.begin() as conn:
        if "article_enrichments" in tables:
            cleared_enrichments = conn.execute(text("DELETE FROM article_enrichments")).rowcount or 0

        if "article_enrichment_jobs" in tables:
            conn.execute(text("DELETE FROM article_enrichment_jobs"))
        if "enrichment_quota" in tables:
            conn.execute(text("DELETE FROM enrichment_quota"))

        if "articles" in tables:
            now = datetime.now(timezone.utc).replace(tzinfo=None)
            reset_articles = conn.execute(
                text(
                    "UPDATE articles "
                    "SET processing_state = :state, "
                    "enrichment_failed = :failed, "
                    "enrichment_failed_at = NULL, "
                    "enrichment_error = NULL, "
                    "updated_at = :updated_at"
                ),
                {"state": "raw", "failed": False, "updated_at": now},
            ).rowcount or 0

    print(
        "Clear enrichment completed. "
        f"Deleted enrichments={cleared_enrichments}, "
        f"Reset articles={reset_articles}"
    )
except SQLAlchemyError as err:
    print(
        "Failed to clear enrichment. Check DATABASE_URL and DB connectivity.\n"
        f"Error: {err}",
        file=sys.stderr,
    )
    sys.exit(1)
PY
