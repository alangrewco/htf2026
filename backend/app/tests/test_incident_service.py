import os
from pathlib import Path
import sys
from datetime import datetime, timezone

import pytest

BACKEND_ROOT = Path(__file__).resolve().parents[2]
GENERATED_ROOT = BACKEND_ROOT / "generated" / "flask-server"

sys.path.insert(0, str(GENERATED_ROOT))
sys.path.insert(0, str(BACKEND_ROOT))

from app.db import session_scope
from app.models import ArticleEnrichmentRecord, ArticleRecord
import app.db as app_db
from app.bootstrap import initialize_database
from app.services.incident_service import IncidentService


@pytest.fixture()
def service(tmp_path, monkeypatch):
    db_path = tmp_path / "incident_service.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path}")
    monkeypatch.setenv("INCIDENT_PROVIDER", "mock")
    IncidentService._initialized = False
    app_db._engine = None
    app_db.SessionLocal = None
    initialize_database()
    return IncidentService()


def _seed_article_with_enrichment(article_id: str, *, relevant: bool):
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    with session_scope() as session:
        session.add(
            ArticleRecord(
                id=article_id,
                source="mock",
                source_url=f"https://example.com/{article_id}",
                headline="Port disruption impacts shipping lanes",
                title="Port disruption impacts shipping lanes",
                summary="Potential disruption summary",
                preview_text="Potential impact to shipment and SKU availability.",
                analysis="",
                keywords_json=[],
                tags_json=[],
                source_name="mock",
                body="Potential impact to shipment and SKU availability.",
                published_at=now,
                publish_datetime=now,
                preview_image_url=None,
                ingestion_run_id="run-1",
                processing_state="enriched" if relevant else "irrelevant",
                external_id=article_id,
                content_hash=f"hash-{article_id}",
                region_tags_json=["US"],
                enrichment_failed=False,
                enrichment_failed_at=None,
                enrichment_error=None,
                enrichment_attempt_count=0,
                created_at=now,
                updated_at=now,
            )
        )
        session.add(
            ArticleEnrichmentRecord(
                article_id=article_id,
                is_relevant=relevant,
                relevance_tags_json=["shipment"] if relevant else [],
                horizon="short_term",
                geo_json={"countries": ["US"], "ports": ["port_lax"], "route_ids": [], "lat": None, "lng": None},
                impact_window_json={
                    "start_at": now.isoformat() + "Z",
                    "end_at": now.isoformat() + "Z",
                    "confidence": 0.8,
                },
                matched_entities_json={"sku_ids": [], "supplier_ids": []},
                risk_score=70 if relevant else 10,
                risk_level="high" if relevant else "low",
                explanation="test",
                updated_at=now,
            )
        )


def test_upsert_incident_for_relevant_article_creates_incident(service):
    _seed_article_with_enrichment("article-1", relevant=True)
    incident = service.upsert_incident_for_article("article-1")
    assert incident is not None
    assert incident.article_id == "article-1"
    assert incident.classification in {"risk_exposure", "active_disruption"}
    assert incident.status == "open"


def test_upsert_incident_for_irrelevant_article_returns_none(service):
    _seed_article_with_enrichment("article-2", relevant=False)
    incident = service.upsert_incident_for_article("article-2")
    assert incident is None
    listed = service.list_incidents(status=None, classification=None, risk_level=None, page=1, page_size=20)
    assert listed.total == 0


def test_list_incidents_filters_and_get(service):
    _seed_article_with_enrichment("article-3", relevant=True)
    created = service.upsert_incident_for_article("article-3")

    listed = service.list_incidents(
        status="open",
        classification=created.classification,
        risk_level=created.risk_level,
        page=1,
        page_size=20,
    )
    assert listed.total >= 1
    assert listed.items[0].id == created.id

    fetched = service.get_incident(created.id)
    assert fetched.id == created.id
    assert fetched.article_id == "article-3"
