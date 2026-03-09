import json
import os
import tempfile
import unittest
from pathlib import Path
from uuid import uuid4

from openapi_server.test import BaseTestCase


TEST_DB_PATH = os.path.join(tempfile.gettempdir(), f"reference_api_integration_test_{uuid4().hex}.db")
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"


class TestReferenceController(BaseTestCase):
    """ReferenceController integration tests."""

    def _json(self, response):
        return json.loads(response.data.decode("utf-8"))

    def _create_sku(self):
        payload = {
            "sku_code": f"SKU-{uuid4().hex[:8]}",
            "name": "LED Panel",
            "description": "12-inch panel",
            "unit_of_measure": "unit",
            "status": "active",
            "risk_score": 42,
            "risk_level": "medium",
            "required_qty": 0,
            "category": "lighting",
            "supplier_ids": [],
        }
        response = self.client.open("/api/v1/reference/skus", method="POST", json=payload)
        self.assertEqual(response.status_code, 201, response.data.decode("utf-8"))
        return self._json(response)

    def _create_supplier(self):
        payload = {
            "supplier_code": f"SUP-{uuid4().hex[:8]}",
            "name": "Acme Parts",
            "country": "US",
            "contact_email": "ops@acme.example",
            "status": "active",
            "region": "North America",
            "risk_rating": "medium",
        }
        response = self.client.open("/api/v1/reference/suppliers", method="POST", json=payload)
        self.assertEqual(response.status_code, 201, response.data.decode("utf-8"))
        return self._json(response)

    def test_list_ports_and_routes(self):
        ports = self.client.open("/api/v1/reference/ports", method="GET", headers={"Accept": "application/json"})
        routes = self.client.open("/api/v1/reference/routes", method="GET", headers={"Accept": "application/json"})

        self.assertEqual(ports.status_code, 200)
        self.assertEqual(routes.status_code, 200)
        self.assertGreater(self._json(ports)["total"], 0)
        self.assertGreater(self._json(routes)["total"], 0)

    def test_sku_create_list_update_and_conflict(self):
        created = self._create_sku()
        sku_id = created["id"]

        listed = self.client.open("/api/v1/reference/skus", method="GET", headers={"Accept": "application/json"})
        self.assertEqual(listed.status_code, 200)
        self.assertGreaterEqual(self._json(listed)["total"], 1)

        updated = self.client.open(
            f"/api/v1/reference/skus/{sku_id}",
            method="PATCH",
            json={"name": "Updated LED Panel"},
        )
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(self._json(updated)["name"], "Updated LED Panel")

        not_found = self.client.open(
            "/api/v1/reference/skus/missing-id",
            method="PATCH",
            json={"name": "Nope"},
        )
        self.assertEqual(not_found.status_code, 404)

        dup_payload = {
            "sku_code": created["sku_code"],
            "name": "Another",
            "description": "Another",
            "unit_of_measure": "unit",
            "status": "active",
            "risk_score": 35,
            "risk_level": "low",
            "required_qty": 0,
            "category": "lighting",
            "supplier_ids": [],
        }
        duplicate = self.client.open("/api/v1/reference/skus", method="POST", json=dup_payload)
        self.assertEqual(duplicate.status_code, 409)

        invalid_risk = dict(dup_payload)
        invalid_risk["sku_code"] = f"SKU-{uuid4().hex[:8]}"
        invalid_risk["risk_level"] = "urgent"
        bad_risk = self.client.open("/api/v1/reference/skus", method="POST", json=invalid_risk)
        self.assertEqual(bad_risk.status_code, 400)

    def test_supplier_create_list_update_and_conflict(self):
        created = self._create_supplier()
        supplier_id = created["id"]

        listed = self.client.open("/api/v1/reference/suppliers", method="GET", headers={"Accept": "application/json"})
        self.assertEqual(listed.status_code, 200)
        self.assertGreaterEqual(self._json(listed)["total"], 1)

        updated = self.client.open(
            f"/api/v1/reference/suppliers/{supplier_id}",
            method="PATCH",
            json={"country": "CA"},
        )
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(self._json(updated)["country"], "CA")

        not_found = self.client.open(
            "/api/v1/reference/suppliers/missing-id",
            method="PATCH",
            json={"country": "FR"},
        )
        self.assertEqual(not_found.status_code, 404)

        dup_payload = {
            "supplier_code": created["supplier_code"],
            "name": "Another Supplier",
            "country": "US",
            "contact_email": "dup@acme.example",
            "status": "active",
            "region": "North America",
            "risk_rating": "low",
        }
        duplicate = self.client.open("/api/v1/reference/suppliers", method="POST", json=dup_payload)
        self.assertEqual(duplicate.status_code, 409)

    def test_shipment_create_update_and_validation(self):
        ports = self._json(self.client.open("/api/v1/reference/ports", method="GET"))
        routes = self._json(self.client.open("/api/v1/reference/routes", method="GET"))
        sku = self._create_sku()
        supplier = self._create_supplier()

        payload = {
            "shipment_code": f"SHIP-{uuid4().hex[:8]}",
            "status": "planned",
            "origin_port_id": ports["items"][0]["id"],
            "destination_port_id": ports["items"][1]["id"],
            "route_id": routes["items"][0]["id"],
            "supplier_id": supplier["id"],
            "skus": {sku["id"]: 1},
            "carrier": "Maersk",
            "order_date": "2026-03-01T10:00:00Z",
            "expected_delivery_date": "2026-03-10T10:00:00Z",
            "events": [
                {
                    "id": f"evt-{uuid4().hex[:8]}",
                    "type": "booked",
                    "description": "Shipment booked",
                    "event_time": "2026-03-01T10:00:00Z",
                    "location": "origin",
                    "status": "ok",
                    "metadata": {"source": "test"},
                }
            ],
        }
        created = self.client.open("/api/v1/reference/shipments", method="POST", json=payload)
        self.assertEqual(created.status_code, 201, created.data.decode("utf-8"))
        shipment = self._json(created)

        listed = self.client.open("/api/v1/reference/shipments", method="GET")
        self.assertEqual(listed.status_code, 200)
        self.assertGreaterEqual(self._json(listed)["total"], 1)

        updated = self.client.open(
            f"/api/v1/reference/shipments/{shipment['id']}",
            method="PATCH",
            json={"status": "in_transit"},
        )
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(self._json(updated)["status"], "in_transit")

        invalid_ref = dict(payload)
        invalid_ref["shipment_code"] = f"SHIP-{uuid4().hex[:8]}"
        invalid_ref["supplier_id"] = "missing-supplier"
        bad_create = self.client.open("/api/v1/reference/shipments", method="POST", json=invalid_ref)
        self.assertEqual(bad_create.status_code, 422)

        invalid_event = dict(payload)
        invalid_event["shipment_code"] = f"SHIP-{uuid4().hex[:8]}"
        invalid_event["events"] = [{"id": f"evt-{uuid4().hex[:8]}", "type": "booked"}]
        bad_event = self.client.open("/api/v1/reference/shipments", method="POST", json=invalid_event)
        self.assertEqual(bad_event.status_code, 400)

        dup_payload = dict(payload)
        dup_payload["shipment_code"] = shipment["shipment_code"]
        duplicate = self.client.open("/api/v1/reference/shipments", method="POST", json=dup_payload)
        self.assertEqual(duplicate.status_code, 409)

        not_found = self.client.open(
            "/api/v1/reference/shipments/missing-id",
            method="PATCH",
            json={"status": "delayed"},
        )
        self.assertEqual(not_found.status_code, 404)


if __name__ == "__main__":
    unittest.main()
