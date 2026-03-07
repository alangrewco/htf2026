import json
import os
from pathlib import Path
import sys
import time
import unittest
from uuid import uuid4

BACKEND_ROOT = Path(__file__).resolve().parents[4]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from openapi_server.test import BaseTestCase
import app.db as app_db
from app.services.enrichment_service import EnrichmentService
from app.services.incident_service import IncidentService
from app.services.ingestion_service import IngestionService


class TestIncidentsController(BaseTestCase):
    def setUp(self):
        os.environ["INGESTION_SOURCE_MODE"] = "mock"
        os.environ["INGESTION_POLLING_DISABLED"] = "true"
        os.environ["ENRICHMENT_PROVIDER"] = "mock"
        os.environ["ENRICHMENT_WORKER_ENABLED"] = "true"
        os.environ["ENRICHMENT_MAX_ARTICLES_TOTAL"] = "100"
        os.environ["INCIDENT_PROVIDER"] = "mock"
        test_db_path = f"/tmp/incidents_api_integration_test_{uuid4().hex}.db"
        os.environ["DATABASE_URL"] = f"sqlite:///{test_db_path}"
        app_db._engine = None
        app_db.SessionLocal = None
        IngestionService._initialized = False
        EnrichmentService._initialized = False
        EnrichmentService._dispatcher_started = False
        IncidentService._initialized = False
        super().setUp()

    def _json(self, response):
        return json.loads(response.data.decode("utf-8"))

    def _seed_and_wait_for_incident(self):
        run = self.client.open(
            "/api/v1/ingestion/runs",
            method="POST",
            headers={"Accept": "application/json", "Content-Type": "application/json"},
            data=json.dumps({"max_articles": 100}),
            content_type="application/json",
        )
        self.assertEqual(run.status_code, 202, run.data.decode("utf-8"))
        run_id = self._json(run)["run_id"]

        deadline = time.time() + 20
        while time.time() < deadline:
            status = self.client.open(f"/api/v1/ingestion/runs/{run_id}", method="GET")
            self.assertEqual(status.status_code, 200, status.data.decode("utf-8"))
            if self._json(status)["status"] in {"completed", "failed"}:
                break
            time.sleep(0.2)

        deadline = time.time() + 20
        while time.time() < deadline:
            listed = self.client.open("/api/v1/incidents?page=1&page_size=20", method="GET")
            self.assertEqual(listed.status_code, 200, listed.data.decode("utf-8"))
            payload = self._json(listed)
            if payload["total"] > 0:
                return payload["items"][0]
            time.sleep(0.2)

        # CI can be slow for background worker scheduling; force deterministic upsert.
        enriched = self.client.open("/api/v1/articles?state=enriched&page=1&page_size=100", method="GET")
        self.assertEqual(enriched.status_code, 200, enriched.data.decode("utf-8"))
        items = self._json(enriched).get("items", [])
        svc = IncidentService()
        for item in items:
            svc.upsert_incident_for_article(item["id"])

        listed = self.client.open("/api/v1/incidents?page=1&page_size=20", method="GET")
        self.assertEqual(listed.status_code, 200, listed.data.decode("utf-8"))
        payload = self._json(listed)
        if payload["total"] > 0:
            return payload["items"][0]
        self.fail("Timed out waiting for incident creation.")

    def test_get_incident(self):
        incident = self._seed_and_wait_for_incident()
        response = self.client.open(
            f"/api/v1/incidents/{incident['id']}",
            method="GET",
            headers={"Accept": "application/json"},
        )
        self.assertEqual(response.status_code, 200, response.data.decode("utf-8"))
        payload = self._json(response)
        self.assertEqual(payload["id"], incident["id"])

    def test_list_incidents(self):
        incident = self._seed_and_wait_for_incident()
        query_string = [
            ("status", incident["status"]),
            ("classification", incident["classification"]),
            ("risk_level", incident["risk_level"]),
            ("page", 1),
            ("page_size", 20),
        ]
        response = self.client.open(
            "/api/v1/incidents",
            method="GET",
            headers={"Accept": "application/json"},
            query_string=query_string,
        )
        self.assertEqual(response.status_code, 200, response.data.decode("utf-8"))
        payload = self._json(response)
        self.assertGreaterEqual(payload["total"], 1)


if __name__ == "__main__":
    unittest.main()
