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


def _list_by_code(path: str, code_field: str):
    _, payload = _req("GET", path)
    by_code = {}
    for item in payload.get("items", []):
        if item.get(code_field):
            by_code[item[code_field]] = item
    return by_code


def _iso_utc(dt: datetime) -> str:
    return dt.replace(microsecond=0).astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def _upsert(path: str, code_field: str, code_value: str, payload: dict, id_field: str):
    existing = _list_by_code(path, code_field)
    if code_value in existing:
        record_id = existing[code_value]["id"]
        _, updated = _req("PATCH", f"{path}/{record_id}", payload)
        return "updated", updated[id_field]
    _, created = _req("POST", path, payload)
    return "created", created[id_field]


def main():
    _, ports = _req("GET", "/reference/ports")
    _, routes = _req("GET", "/reference/routes")
    if not ports.get("items") or not routes.get("items"):
        raise RuntimeError("Ports/routes must exist before seeding SKUs/suppliers/shipments.")

    port_ids = [p["id"] for p in ports["items"]]
    route_ids = [r["id"] for r in routes["items"]]

    suppliers = [
        {"supplier_code": "SUP-APAC-001", "name": "Shenzhen Bright Components", "country": "CN", "contact_email": "ops@szbright.example", "status": "active", "region": "Asia Pacific", "risk_rating": "medium"},
        {"supplier_code": "SUP-APAC-002", "name": "Kaohsiung LED Metals", "country": "TW", "contact_email": "ops@kledmetals.example", "status": "active", "region": "Asia Pacific", "risk_rating": "high"},
        {"supplier_code": "SUP-NA-001", "name": "Pacific Plastics USA", "country": "US", "contact_email": "ops@pacplastics.example", "status": "active", "region": "North America", "risk_rating": "low"},
        {"supplier_code": "SUP-EU-001", "name": "Rotterdam Industrial Parts", "country": "NL", "contact_email": "ops@rotindparts.example", "status": "active", "region": "Europe", "risk_rating": "medium"},
        {"supplier_code": "SUP-LATAM-001", "name": "Monterrey Wiring Group", "country": "MX", "contact_email": "ops@monterreywire.example", "status": "active", "region": "Latin America", "risk_rating": "medium"},
        {"supplier_code": "SUP-NA-002", "name": "Great Lakes Packaging", "country": "US", "contact_email": "ops@glpack.example", "status": "active", "region": "North America", "risk_rating": "low"},
    ]

    supplier_id_by_code = {}
    stats = {"supplier_created": 0, "supplier_updated": 0, "sku_created": 0, "sku_updated": 0, "shipment_created": 0, "shipment_updated": 0}

    for supplier in suppliers:
        action, supplier_id = _upsert("/reference/suppliers", "supplier_code", supplier["supplier_code"], supplier, "id")
        supplier_id_by_code[supplier["supplier_code"]] = supplier_id
        stats[f"supplier_{action}"] += 1

    skus = [
        {"sku_code": "SKU-LED-001", "name": "LED Driver Board A1", "description": "Power driver board for lighting assemblies", "unit_of_measure": "unit", "status": "active", "risk_score": 72, "risk_level": "high", "category": "electronics", "supplier_ids": [supplier_id_by_code["SUP-APAC-001"], supplier_id_by_code["SUP-APAC-002"]]},
        {"sku_code": "SKU-LED-002", "name": "LED Metal Leg Frame", "description": "Metal support frame used in LED fixtures", "unit_of_measure": "unit", "status": "active", "risk_score": 88, "risk_level": "critical", "category": "metal_components", "supplier_ids": [supplier_id_by_code["SUP-APAC-002"], supplier_id_by_code["SUP-EU-001"]]},
        {"sku_code": "SKU-WIRE-001", "name": "Copper Harness Set", "description": "Copper wiring harness for control module", "unit_of_measure": "set", "status": "active", "risk_score": 63, "risk_level": "medium", "category": "electrical", "supplier_ids": [supplier_id_by_code["SUP-LATAM-001"], supplier_id_by_code["SUP-NA-001"]]},
        {"sku_code": "SKU-PACK-001", "name": "Shockproof Shipping Crate", "description": "Protective crate for outbound shipments", "unit_of_measure": "unit", "status": "active", "risk_score": 35, "risk_level": "low", "category": "packaging", "supplier_ids": [supplier_id_by_code["SUP-NA-002"]]},
        {"sku_code": "SKU-CTRL-001", "name": "Embedded Control Module", "description": "Control board for routing and telemetry", "unit_of_measure": "unit", "status": "active", "risk_score": 55, "risk_level": "medium", "category": "electronics", "supplier_ids": [supplier_id_by_code["SUP-APAC-001"], supplier_id_by_code["SUP-EU-001"]]},
        {"sku_code": "SKU-FAST-001", "name": "Marine Fastener Kit", "description": "Corrosion-resistant fastener kit", "unit_of_measure": "kit", "status": "active", "risk_score": 47, "risk_level": "medium", "category": "hardware", "supplier_ids": [supplier_id_by_code["SUP-EU-001"], supplier_id_by_code["SUP-NA-001"]]},
    ]

    sku_id_by_code = {}
    for sku in skus:
        action, sku_id = _upsert("/reference/skus", "sku_code", sku["sku_code"], sku, "id")
        sku_id_by_code[sku["sku_code"]] = sku_id
        stats[f"sku_{action}"] += 1

    now = datetime.now(timezone.utc)
    shipments = [
        {
            "shipment_code": "SHIP-APAC-US-001",
            "status": "in_transit",
            "origin_port_id": port_ids[1 % len(port_ids)],
            "destination_port_id": port_ids[0],
            "route_id": route_ids[0],
            "supplier_id": supplier_id_by_code["SUP-APAC-001"],
            "sku_ids": [sku_id_by_code["SKU-LED-001"], sku_id_by_code["SKU-CTRL-001"]],
            "carrier": "Maersk",
            "order_date": _iso_utc(now - timedelta(days=8)),
            "expected_delivery_date": _iso_utc(now + timedelta(days=6)),
            "events": [{"id": "evt-ship-apac-us-001", "type": "departed_port", "description": "Vessel departed origin port", "event_time": _iso_utc(now - timedelta(days=6)), "location": "origin", "status": "ok", "metadata": {"source": "seed"}}],
        },
        {
            "shipment_code": "SHIP-EU-US-001",
            "status": "planned",
            "origin_port_id": port_ids[2 % len(port_ids)],
            "destination_port_id": port_ids[0],
            "route_id": route_ids[min(1, len(route_ids) - 1)],
            "supplier_id": supplier_id_by_code["SUP-EU-001"],
            "sku_ids": [sku_id_by_code["SKU-FAST-001"], sku_id_by_code["SKU-PACK-001"]],
            "carrier": "COSCO",
            "order_date": _iso_utc(now - timedelta(days=2)),
            "expected_delivery_date": _iso_utc(now + timedelta(days=13)),
            "events": [{"id": "evt-ship-eu-us-001", "type": "booking_confirmed", "description": "Booking confirmed by carrier", "event_time": _iso_utc(now - timedelta(days=1)), "location": "origin", "status": "ok", "metadata": {"source": "seed"}}],
        },
        {
            "shipment_code": "SHIP-LATAM-US-001",
            "status": "delayed",
            "origin_port_id": port_ids[0],
            "destination_port_id": port_ids[1 % len(port_ids)],
            "route_id": route_ids[0],
            "supplier_id": supplier_id_by_code["SUP-LATAM-001"],
            "sku_ids": [sku_id_by_code["SKU-WIRE-001"]],
            "carrier": "Hapag-Lloyd",
            "order_date": _iso_utc(now - timedelta(days=12)),
            "expected_delivery_date": _iso_utc(now + timedelta(days=4)),
            "events": [{"id": "evt-ship-latam-us-001", "type": "weather_delay", "description": "Weather disruption created delay", "event_time": _iso_utc(now - timedelta(days=1)), "location": "transit", "status": "warning", "metadata": {"source": "seed"}}],
        },
    ]

    for shipment in shipments:
        action, _shipment_id = _upsert(
            "/reference/shipments", "shipment_code", shipment["shipment_code"], shipment, "id"
        )
        stats[f"shipment_{action}"] += 1

    print(json.dumps({"ok": True, "api_base_url": BASE_URL, "stats": stats}, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(json.dumps({"ok": False, "error": str(exc)}))
        sys.exit(1)
PY
