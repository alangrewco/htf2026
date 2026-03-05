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

python3 -m openapi_server
