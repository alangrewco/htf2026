#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE"
  exit 1
fi

# Load .env safely (supports values with spaces without requiring shell quoting)
while IFS= read -r line || [[ -n "$line" ]]; do
  [[ -z "${line// }" ]] && continue
  [[ "${line#\#}" != "$line" ]] && continue
  [[ "$line" != *"="* ]] && continue

  key="${line%%=*}"
  value="${line#*=}"

  key="${key#"${key%%[![:space:]]*}"}"
  key="${key%"${key##*[![:space:]]}"}"

  [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue
  export "$key=$value"
done < "$ENV_FILE"

export API_BASE_URL="${API_BASE_URL:-http://127.0.0.1:8080/api/v1}"

python3 - <<'PY'
import json
import os
import sys
from datetime import datetime, timedelta, timezone
from urllib import error, request

BASE_URL = os.environ["API_BASE_URL"].rstrip("/")
TIMEOUT_SEC = 45


def _req(method: str, path: str, payload=None):
    data = None
    headers = {"Accept": "application/json", "Content-Type": "application/json"}
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
    req = request.Request(f"{BASE_URL}{path}", data=data, headers=headers, method=method)
    try:
        with request.urlopen(req, timeout=TIMEOUT_SEC) as resp:
            body = resp.read().decode("utf-8")
            return resp.status, json.loads(body) if body else {}
    except error.HTTPError as exc:
        body = exc.read().decode("utf-8")
        parsed = body
        try:
            parsed = json.loads(body)
        except Exception:
            pass
        raise RuntimeError(f"{method} {path} failed: {exc.code} {parsed}") from exc
    except error.URLError as exc:
        raise RuntimeError(f"{method} {path} failed: {exc.reason}") from exc


def _derive_category(text: str) -> str:
    t = (text or "").lower()
    if "led" in t or "driver" in t or "board" in t:
        return "electronics"
    if "wire" in t or "harness" in t or "copper" in t:
        return "electrical"
    if "pack" in t or "crate" in t:
        return "packaging"
    if "metal" in t or "fastener" in t:
        return "hardware"
    return "general"


def _derive_region(country: str) -> str:
    c = (country or "").upper()
    if c in {"US", "CA", "MX"}:
        return "North America"
    if c in {"CN", "JP", "KR", "TW", "SG", "IN", "VN"}:
        return "Asia Pacific"
    if c in {"NL", "DE", "FR", "IT", "ES", "GB"}:
        return "Europe"
    if c in {"BR", "AR", "CL", "CO", "PE"}:
        return "Latin America"
    return "Global"


def _risk_from_score(score: int) -> str:
    if score >= 80:
        return "critical"
    if score >= 65:
        return "high"
    if score >= 40:
        return "medium"
    return "low"


def _is_blank(value):
    return value is None or (isinstance(value, str) and value.strip() == "")


def _iso_utc(dt: datetime) -> str:
    return dt.replace(microsecond=0).astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def main():
    stats = {
        "skus_patched": 0,
        "suppliers_patched": 0,
        "shipments_patched": 0,
        "errors": 0,
    }

    _, suppliers_payload = _req("GET", "/reference/suppliers")
    supplier_ids = [item["id"] for item in suppliers_payload.get("items", [])]
    default_supplier_id = supplier_ids[0] if supplier_ids else None

    _, sku_payload = _req("GET", "/reference/skus")
    for sku in sku_payload.get("items", []):
        patch = {}
        score = sku.get("risk_score")
        if score is None:
            score = 50
            patch["risk_score"] = score
        if _is_blank(sku.get("risk_level")):
            patch["risk_level"] = _risk_from_score(int(score))
        if _is_blank(sku.get("category")):
            patch["category"] = _derive_category(f"{sku.get('name', '')} {sku.get('description', '')}")
        if sku.get("supplier_ids") is None:
            patch["supplier_ids"] = [default_supplier_id] if default_supplier_id else []
        if patch:
            _req("PATCH", f"/reference/skus/{sku['id']}", patch)
            stats["skus_patched"] += 1

    _, supplier_payload = _req("GET", "/reference/suppliers")
    for supplier in supplier_payload.get("items", []):
        patch = {}
        if _is_blank(supplier.get("region")):
            patch["region"] = _derive_region(supplier.get("country", ""))
        if _is_blank(supplier.get("risk_rating")):
            patch["risk_rating"] = "medium"
        if patch:
            _req("PATCH", f"/reference/suppliers/{supplier['id']}", patch)
            stats["suppliers_patched"] += 1

    _, shipment_payload = _req("GET", "/reference/shipments")
    now = datetime.now(timezone.utc)
    for shipment in shipment_payload.get("items", []):
        patch = {}
        if _is_blank(shipment.get("carrier")):
            patch["carrier"] = "Unknown Carrier"
        if _is_blank(shipment.get("order_date")):
            patch["order_date"] = _iso_utc(now - timedelta(days=3))
        if _is_blank(shipment.get("expected_delivery_date")):
            patch["expected_delivery_date"] = _iso_utc(now + timedelta(days=10))
        events = shipment.get("events")
        if events is None or (isinstance(events, list) and len(events) == 0):
            patch["events"] = [
                {
                    "id": f"evt-backfill-{shipment['id'][:8]}",
                    "type": "backfill_initialized",
                    "description": "Backfilled shipment event history",
                    "event_time": _iso_utc(now),
                    "location": "unknown",
                    "status": "ok",
                    "metadata": {"source": "backfill_reference_data"},
                }
            ]
        if patch:
            _req("PATCH", f"/reference/shipments/{shipment['id']}", patch)
            stats["shipments_patched"] += 1

    print(json.dumps({"ok": True, "api_base_url": BASE_URL, "stats": stats}, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(json.dumps({"ok": False, "error": str(exc)}))
        sys.exit(1)
PY
