import json
import os
import unittest
from pathlib import Path
from uuid import uuid4

from openapi_server.test import BaseTestCase


TEST_DB_PATH = "/tmp/reference_api_integration_test.db"
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"


class TestReferenceController(BaseTestCase):
    """ReferenceController integration tests."""

    @classmethod
    def setUpClass(cls):
        if os.path.exists(TEST_DB_PATH):
            os.remove(TEST_DB_PATH)

    def _json(self, response):
        return json.loads(response.data.decode("utf-8"))

    def _create_sku(self):
        payload = {
            "sku_code": f"SKU-{uuid4().hex[:8]}",
            "name": "LED Panel",
            "description": "12-inch panel",
            "unit_of_measure": "unit",
            "status": "active",
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
        }
        duplicate = self.client.open("/api/v1/reference/skus", method="POST", json=dup_payload)
        self.assertEqual(duplicate.status_code, 409)

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
            "sku_ids": [sku["id"]],
            "eta": "2026-03-10T10:00:00Z",
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
