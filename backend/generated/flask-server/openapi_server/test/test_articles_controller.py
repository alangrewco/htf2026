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
from app.services.article_service import ArticleService
from app.services.enrichment_service import EnrichmentService
from app.services.ingestion_service import IngestionService

os.environ["INGESTION_SOURCE_MODE"] = "mock"
os.environ["INGESTION_POLLING_DISABLED"] = "true"
os.environ["ENRICHMENT_PROVIDER"] = "mock"
os.environ["ENRICHMENT_WORKER_ENABLED"] = "true"
os.environ["ENRICHMENT_MAX_ARTICLES_TOTAL"] = "100"


class TestArticlesController(BaseTestCase):
    def setUp(self):
        os.environ["INGESTION_SOURCE_MODE"] = "mock"
        os.environ["INGESTION_POLLING_DISABLED"] = "true"
        os.environ["ENRICHMENT_PROVIDER"] = "mock"
        os.environ["ENRICHMENT_WORKER_ENABLED"] = "true"
        os.environ["ENRICHMENT_MAX_ARTICLES_TOTAL"] = "100"
        test_db_path = f"/tmp/articles_api_integration_test_{uuid4().hex}.db"
        os.environ["DATABASE_URL"] = f"sqlite:///{test_db_path}"
        app_db._engine = None
        app_db.SessionLocal = None
        IngestionService._initialized = False
        ArticleService._initialized = False
        EnrichmentService._initialized = False
        EnrichmentService._dispatcher_started = False
        super().setUp()

    def _json(self, response):
        return json.loads(response.data.decode("utf-8"))

    def _seed_articles(self):
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
                return
            time.sleep(0.2)
        self.fail("Timed out waiting for seeded ingestion run.")

    def test_list_articles_and_filters(self):
        self._seed_articles()
        response = self.client.open("/api/v1/articles?page=1&page_size=20", method="GET")
        self.assertEqual(response.status_code, 200, response.data.decode("utf-8"))
        payload = self._json(response)
        self.assertGreater(payload["total"], 0)

        by_state = self.client.open("/api/v1/articles?state=enriched&page=1&page_size=20", method="GET")
        self.assertEqual(by_state.status_code, 200, by_state.data.decode("utf-8"))

        by_relevance = self.client.open("/api/v1/articles?relevant=true&page=1&page_size=20", method="GET")
        self.assertEqual(by_relevance.status_code, 200, by_relevance.data.decode("utf-8"))

    def test_get_article_and_enrichment(self):
        self._seed_articles()
        deadline = time.time() + 10
        article_id = None
        while time.time() < deadline:
            for state in ("enriched", "irrelevant"):
                listed = self.client.open(f"/api/v1/articles?state={state}&page=1&page_size=1", method="GET")
                self.assertEqual(listed.status_code, 200, listed.data.decode("utf-8"))
                payload = self._json(listed)
                if payload["total"] > 0 and payload["items"]:
                    article_id = payload["items"][0]["id"]
                    break
            if article_id:
                break
            time.sleep(0.2)
        self.assertIsNotNone(article_id)

        detail = self.client.open(f"/api/v1/articles/{article_id}", method="GET")
        self.assertEqual(detail.status_code, 200, detail.data.decode("utf-8"))
        deadline = time.time() + 10
        enrichment = None
        while time.time() < deadline:
            enrichment = self.client.open(f"/api/v1/articles/{article_id}/enrichment", method="GET")
            if enrichment.status_code == 200:
                break
            time.sleep(0.2)
        self.assertIsNotNone(enrichment)
        self.assertEqual(enrichment.status_code, 200, enrichment.data.decode("utf-8"))

        missing = self.client.open("/api/v1/articles/missing-article", method="GET")
        self.assertEqual(missing.status_code, 404)


if __name__ == "__main__":
    unittest.main()
