from __future__ import annotations

from datetime import datetime

import pytest

from app import create_app
from models import (
    Carrier,
    Inventory,
    Port,
    Preference,
    Route,
    SKU,
    Shipment,
    db,
)


@pytest.fixture()
def app():
    app = create_app(
        {
            "TESTING": True,
            "ENABLE_SCHEDULER": False,
            "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        }
    )
    with app.app_context():
        db.create_all()

        db.session.add_all(
            [
                SKU(
                    id=1,
                    name="Battery Module A",
                    unit_cost=120.0,
                    revenue_impact_per_day_stockout=5000.0,
                ),
                SKU(
                    id=2,
                    name="Controller Chip B",
                    unit_cost=80.0,
                    revenue_impact_per_day_stockout=4500.0,
                ),
                Port(code="CNSHA", name="Shanghai", country="CN", lat=31.4, lon=121.8),
                Port(code="USLAX", name="Los Angeles", country="US", lat=33.7, lon=-118.2),
                Port(code="USTIW", name="Tacoma", country="US", lat=47.3, lon=-122.4),
                Carrier(id=1, name="Oceanic One"),
                Carrier(id=2, name="Pacific Bridge"),
                Route(id=1, name="Asia-US West Main", waypoints_json=[{"code": "CNSHA"}, {"code": "USLAX"}]),
                Shipment(
                    id=1,
                    sku_id=1,
                    origin_port="CNSHA",
                    dest_port="USLAX",
                    etd=datetime(2026, 3, 4),
                    eta=datetime(2026, 3, 22),
                    carrier_id=1,
                    status="in_transit",
                    route_id=1,
                ),
                Shipment(
                    id=2,
                    sku_id=2,
                    origin_port="CNSHA",
                    dest_port="USTIW",
                    etd=datetime(2026, 3, 5),
                    eta=datetime(2026, 3, 21),
                    carrier_id=2,
                    status="booked",
                    route_id=1,
                ),
                Inventory(id=1, sku_id=1, on_hand=220, reorder_point=160),
                Inventory(id=2, sku_id=2, on_hand=140, reorder_point=120),
                Preference(
                    profile="resilient",
                    w_cost=0.3,
                    w_speed=0.3,
                    w_risk=0.4,
                    blocked_ports=[],
                    preferred_carriers=[1],
                ),
            ]
        )
        db.session.commit()

    yield app


@pytest.fixture()
def client(app):
    return app.test_client()
