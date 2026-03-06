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
from app.services.ingestion_service import IngestionService

os.environ["INGESTION_SOURCE_MODE"] = "mock"
os.environ["INGESTION_POLLING_DISABLED"] = "true"
os.environ["ENRICHMENT_PROVIDER"] = "mock"
os.environ["ENRICHMENT_WORKER_ENABLED"] = "true"
os.environ["ENRICHMENT_MAX_ARTICLES_TOTAL"] = "100"


class TestIngestionController(BaseTestCase):
    def setUp(self):
        os.environ["INGESTION_SOURCE_MODE"] = "mock"
        os.environ["INGESTION_POLLING_DISABLED"] = "true"
        os.environ["ENRICHMENT_PROVIDER"] = "mock"
        os.environ["ENRICHMENT_WORKER_ENABLED"] = "true"
        os.environ["ENRICHMENT_MAX_ARTICLES_TOTAL"] = "100"
        test_db_path = f"/tmp/ingestion_api_integration_test_{uuid4().hex}.db"
        os.environ["DATABASE_URL"] = f"sqlite:///{test_db_path}"
        app_db._engine = None
        app_db.SessionLocal = None
        IngestionService._initialized = False
        EnrichmentService._initialized = False
        EnrichmentService._dispatcher_started = False
        super().setUp()

    def _json(self, response):
        return json.loads(response.data.decode("utf-8"))

    def _wait_for_run_completion(self, run_id: str, timeout_sec: int = 20):
        deadline = time.time() + timeout_sec
        while time.time() < deadline:
            response = self.client.open(f"/api/v1/ingestion/runs/{run_id}", method="GET")
            self.assertEqual(response.status_code, 200, response.data.decode("utf-8"))
            payload = self._json(response)
            if payload["status"] in {"completed", "failed"}:
                return payload
            time.sleep(0.2)
        self.fail(f"Run {run_id} did not finish within {timeout_sec}s")

    def test_create_ingestion_run_and_get_status(self):
        response = self.client.open(
            "/api/v1/ingestion/runs",
            method="POST",
            headers={"Accept": "application/json", "Content-Type": "application/json"},
            data=json.dumps({"max_articles": 100}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 202, response.data.decode("utf-8"))
        queued = self._json(response)
        self.assertTrue(queued["run_id"])
        self.assertEqual(queued["status"], "queued")

        completed = self._wait_for_run_completion(queued["run_id"])
        self.assertIn(completed["status"], ["completed", "failed"])
        self.assertGreaterEqual(completed["stats"]["articles_ingested"], 0)
        self.assertGreaterEqual(completed["stats"]["articles_relevant"], 0)

        listed = self.client.open("/api/v1/ingestion/runs?page=1&page_size=20", method="GET")
        self.assertEqual(listed.status_code, 200, listed.data.decode("utf-8"))
        listed_payload = self._json(listed)
        self.assertGreaterEqual(listed_payload["total"], 1)

        scheduler = self.client.open("/api/v1/ingestion/status", method="GET")
        self.assertEqual(scheduler.status_code, 200, scheduler.data.decode("utf-8"))
        scheduler_payload = self._json(scheduler)
        self.assertIsNotNone(scheduler_payload["last_run"])

    def test_dedupes_across_repeated_runs(self):
        first = self.client.open(
            "/api/v1/ingestion/runs",
            method="POST",
            headers={"Accept": "application/json", "Content-Type": "application/json"},
            data=json.dumps({"max_articles": 100}),
            content_type="application/json",
        )
        self.assertEqual(first.status_code, 202, first.data.decode("utf-8"))
        first_run_id = self._json(first)["run_id"]
        self._wait_for_run_completion(first_run_id)

        list_one = self.client.open("/api/v1/articles?page=1&page_size=100", method="GET")
        self.assertEqual(list_one.status_code, 200, list_one.data.decode("utf-8"))
        total_after_first = self._json(list_one)["total"]
        self.assertGreater(total_after_first, 0)

        second = self.client.open(
            "/api/v1/ingestion/runs",
            method="POST",
            headers={"Accept": "application/json", "Content-Type": "application/json"},
            data=json.dumps({"max_articles": 100}),
            content_type="application/json",
        )
        self.assertEqual(second.status_code, 202, second.data.decode("utf-8"))
        second_run_id = self._json(second)["run_id"]
        self._wait_for_run_completion(second_run_id)

        list_two = self.client.open("/api/v1/articles?page=1&page_size=100", method="GET")
        self.assertEqual(list_two.status_code, 200, list_two.data.decode("utf-8"))
        total_after_second = self._json(list_two)["total"]
        self.assertEqual(total_after_second, total_after_first)


if __name__ == "__main__":
    unittest.main()
