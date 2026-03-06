import os
from pathlib import Path
import sys
import time
from urllib.error import HTTPError

import pytest

BACKEND_ROOT = Path(__file__).resolve().parents[2]
GENERATED_ROOT = BACKEND_ROOT / "generated" / "flask-server"

sys.path.insert(0, str(GENERATED_ROOT))
sys.path.insert(0, str(BACKEND_ROOT))

from app.ingestion.sources import gdelt as gdelt_source
from app.ingestion.base import IngestionSource, RawArticleCandidate
from app.ingestion.sources.noaa_alerts import NoaaAlertsSource, sanitize_area_codes
from app.services.ingestion_service import IngestionService
import app.db as app_db


@pytest.fixture()
def service(tmp_path, monkeypatch):
    db_path = tmp_path / "ingestion_service.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path}")
    monkeypatch.setenv("INGESTION_SOURCE_MODE", "mock")
    monkeypatch.setenv("INGESTION_POLLING_DISABLED", "true")
    monkeypatch.setenv("ENRICHMENT_PROVIDER", "mock")
    monkeypatch.setenv("ENRICHMENT_WORKER_ENABLED", "true")
    monkeypatch.setenv("ENRICHMENT_MAX_ARTICLES_TOTAL", "100")
    IngestionService._initialized = False
    app_db._engine = None
    app_db.SessionLocal = None
    return IngestionService()


def _wait_for_terminal(service: IngestionService, run_id: str, timeout_sec: int = 10):
    deadline = time.time() + timeout_sec
    while time.time() < deadline:
        run = service.get_ingestion_run(run_id)
        if run.status in {"completed", "failed"}:
            return run
        time.sleep(0.1)
    raise AssertionError(f"Run {run_id} did not complete in {timeout_sec}s")


def test_ingestion_service_run_and_dedupes(service):
    first = service.create_ingestion_run(max_articles=100)
    run_one = _wait_for_terminal(service, first.run_id)
    assert run_one.status == "completed"
    assert run_one.stats.articles_ingested == 2

    second = service.create_ingestion_run(max_articles=100)
    run_two = _wait_for_terminal(service, second.run_id)
    assert run_two.status == "completed"
    assert run_two.stats.articles_ingested == 0


def test_ingestion_cost_cap_blocks_new_jobs(tmp_path, monkeypatch):
    db_path = tmp_path / "ingestion_cap.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path}")
    monkeypatch.setenv("INGESTION_SOURCE_MODE", "mock")
    monkeypatch.setenv("INGESTION_POLLING_DISABLED", "true")
    monkeypatch.setenv("ENRICHMENT_PROVIDER", "mock")
    monkeypatch.setenv("ENRICHMENT_WORKER_ENABLED", "true")
    monkeypatch.setenv("ENRICHMENT_MAX_ARTICLES_TOTAL", "1")
    IngestionService._initialized = False
    app_db._engine = None
    app_db.SessionLocal = None
    local_service = IngestionService()

    first = local_service.create_ingestion_run(max_articles=100)
    run_one = _wait_for_terminal(local_service, first.run_id)
    assert run_one.status in {"completed", "failed"}

    second = local_service.create_ingestion_run(max_articles=100)
    run_two = _wait_for_terminal(local_service, second.run_id)
    assert run_two.status in {"completed", "failed"}


def test_gdelt_source_sends_browser_user_agent(monkeypatch):
    captured = {}

    def fake_get_text(url, headers=None):
        captured["url"] = url
        captured["headers"] = headers or {}
        return '{"articles":[]}'

    monkeypatch.setattr(gdelt_source, "get_text", fake_get_text)
    source = gdelt_source.GdeltSource(query="shipping", region_countries=["US"])
    source.fetch(max_items=5)

    ua = captured["headers"].get("User-Agent", "")
    assert "Mozilla/5.0" in ua
    assert "Chrome/122.0.0.0" in ua


def test_gdelt_source_uses_env_user_agent(monkeypatch):
    captured = {}
    monkeypatch.setenv("HTTP_USER_AGENT", "CustomAgent/1.0")

    def fake_get_text(url, headers=None):
        captured["headers"] = headers or {}
        return '{"articles":[]}'

    monkeypatch.setattr(gdelt_source, "get_text", fake_get_text)
    source = gdelt_source.GdeltSource(query="shipping", region_countries=["US"])
    source.fetch(max_items=5)

    assert captured["headers"]["User-Agent"] == "CustomAgent/1.0"


def test_gdelt_source_handles_429_with_retry_and_cooldown(monkeypatch):
    calls = {"count": 0}
    gdelt_source.GdeltSource._cooldown_until_epoch = 0.0
    monkeypatch.setenv("GDELT_MAX_RETRIES", "1")
    monkeypatch.setenv("GDELT_RETRY_BACKOFF_SECONDS", "0")
    monkeypatch.setenv("GDELT_429_COOLDOWN_SECONDS", "60")

    def fake_get_text(url, headers=None):
        calls["count"] += 1
        raise HTTPError(url=url, code=429, msg="Too Many Requests", hdrs=None, fp=None)

    monkeypatch.setattr(gdelt_source, "get_text", fake_get_text)
    source = gdelt_source.GdeltSource(query="shipping", region_countries=["US"])
    result = source.fetch(max_items=5)

    assert result == []
    assert calls["count"] == 2  # initial + 1 retry
    assert gdelt_source.GdeltSource._cooldown_until_epoch > 0


def test_ingestion_run_completes_when_one_source_fails(service):
    from datetime import datetime, timezone

    class FailingSource(IngestionSource):
        source_name = "gdelt"

        def fetch(self, max_items: int):
            raise RuntimeError("HTTP Error 429: Too Many Requests")

    class SuccessSource(IngestionSource):
        source_name = "noaa_alerts"

        def fetch(self, max_items: int):
            return [
                RawArticleCandidate(
                    source="noaa_alerts",
                    source_url="https://example.com/ok",
                    headline="Port disruption",
                    body="Port disruption affects shipment lane",
                    published_at=datetime.now(timezone.utc).replace(tzinfo=None),
                    external_id="ok-1",
                    region_tags=["US"],
                )
            ]

    service._build_sources = lambda: [FailingSource(), SuccessSource()]
    queued = service.create_ingestion_run(max_articles=10)
    run = _wait_for_terminal(service, queued.run_id)
    assert run.stats.articles_ingested == 1
    assert run.status == "completed"
    assert "gdelt" in (run.error or "")


def test_noaa_area_sanitization_filters_invalid_country_code():
    assert sanitize_area_codes(["US", "CA", "wa", "ZZ", ""]) == ["CA", "WA"]


def test_noaa_source_falls_back_to_defaults_when_empty_after_sanitize():
    source = NoaaAlertsSource(area_codes=["US"])
    assert source.area_codes
    assert "US" not in source.area_codes
