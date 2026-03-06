import os
from pathlib import Path
import sys

import pytest

BACKEND_ROOT = Path(__file__).resolve().parents[2]
GENERATED_ROOT = BACKEND_ROOT / "generated" / "flask-server"

sys.path.insert(0, str(GENERATED_ROOT))
sys.path.insert(0, str(BACKEND_ROOT))

from app.services.reference_service import ReferenceService
from openapi_server.models.create_shipment_request import CreateShipmentRequest
from openapi_server.models.create_sku_request import CreateSkuRequest
from openapi_server.models.create_supplier_request import CreateSupplierRequest
from openapi_server.models.update_shipment_request import UpdateShipmentRequest


@pytest.fixture()
def service(tmp_path, monkeypatch):
    db_path = tmp_path / 'ref_service.db'
    monkeypatch.setenv('DATABASE_URL', f'sqlite:///{db_path}')
    ReferenceService._initialized = False
    return ReferenceService()


def test_reference_service_create_and_update(service):
    ports = service.list_ports()
    routes = service.list_routes()

    sku = service.create_sku(
        CreateSkuRequest(
            sku_code='SKU-1',
            name='LED Panel',
            description='12-inch panel',
            unit_of_measure='unit',
            status='active',
        )
    )

    supplier = service.create_supplier(
        CreateSupplierRequest(
            supplier_code='SUP-1',
            name='Acme Parts',
            country='US',
            contact_email='ops@acme.com',
            status='active',
        )
    )

    shipment = service.create_shipment(
        CreateShipmentRequest(
            shipment_code='SHIP-1',
            status='planned',
            origin_port_id=ports.items[0].id,
            destination_port_id=ports.items[1].id,
            route_id=routes.items[0].id,
            supplier_id=supplier.id,
            sku_ids=[sku.id],
            eta='2026-03-10T10:00:00Z',
        )
    )

    updated = service.update_shipment(shipment.id, UpdateShipmentRequest(status='in_transit'))

    assert service.list_skus().total == 1
    assert service.list_suppliers().total == 1
    assert service.list_shipments().total == 1
    assert updated.status == 'in_transit'
