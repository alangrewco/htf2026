from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

from app import create_app
from models import (
    Carrier,
    Company,
    Inventory,
    Port,
    Preference,
    Route,
    SKU,
    Shipment,
    Strategy,
    Supplier,
    db,
)

FIXTURES_DIR = Path(__file__).parent / "fixtures"


MODEL_MAP = {
    "skus.json": SKU,
    "suppliers.json": Supplier,
    "ports.json": Port,
    "carriers.json": Carrier,
    "routes.json": Route,
    "inventory.json": Inventory,
    "preferences.json": Preference,
    "company.json": Company,
    "strategies.json": Strategy,
}


def _load_json(name: str):
    return json.loads((FIXTURES_DIR / name).read_text())


def seed():
    app = create_app({"ENABLE_SCHEDULER": False})
    with app.app_context():
        db.drop_all()
        db.create_all()

        for fixture_name, model in MODEL_MAP.items():
            for row in _load_json(fixture_name):
                db.session.add(model(**row))

        for row in _load_json("shipments.json"):
            db.session.add(
                Shipment(
                    id=row["id"],
                    sku_id=row["sku_id"],
                    origin_port=row["origin_port"],
                    dest_port=row["dest_port"],
                    etd=datetime.fromisoformat(row["etd"]),
                    eta=datetime.fromisoformat(row["eta"]),
                    carrier_id=row["carrier_id"],
                    status=row["status"],
                    route_id=row.get("route_id"),
                )
            )

        db.session.commit()
        print("Seeded demo data (including Company + Strategy).")


if __name__ == "__main__":
    seed()

