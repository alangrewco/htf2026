from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace
import sys

BACKEND_ROOT = Path(__file__).resolve().parents[2]
GENERATED_ROOT = BACKEND_ROOT / "generated" / "flask-server"

sys.path.insert(0, str(GENERATED_ROOT))
sys.path.insert(0, str(BACKEND_ROOT))

from app.adk.enrichment_agent import GeminiEnrichmentAgent


def _article():
    return SimpleNamespace(
        source="mock_source",
        source_url="https://example.com/news",
        headline="Port disruption affects shipment lanes",
        body="A storm is impacting freight and shipment schedules at major ports.",
        published_at=datetime.now(timezone.utc).replace(tzinfo=None),
        external_id="a-1",
        region_tags_json=["US"],
    )


def test_mock_enrichment_produces_article_metadata(monkeypatch):
    monkeypatch.setenv("ENRICHMENT_PROVIDER", "mock")
    agent = GeminiEnrichmentAgent()
    payload = agent.enrich_article(_article(), context={"skus": [], "suppliers": [], "ports": [], "routes": []})

    metadata = payload["article_metadata"]
    assert isinstance(metadata["title"], str) and metadata["title"]
    assert isinstance(metadata["summary"], str) and metadata["summary"]
    assert isinstance(metadata["preview_text"], str) and metadata["preview_text"]
    assert isinstance(metadata["analysis"], str) and metadata["analysis"]
    assert isinstance(metadata["keywords"], list) and len(metadata["keywords"]) >= 1
    assert isinstance(metadata["tags"], list) and len(metadata["tags"]) >= 1
    assert isinstance(metadata["source_name"], str) and metadata["source_name"]
    assert isinstance(metadata["publish_datetime"], datetime)


def test_article_metadata_invalid_image_url_normalized_to_none():
    article = _article()
    enrichment = {"explanation": "explain", "relevance_tags": ["shipment"]}
    metadata = GeminiEnrichmentAgent._normalize_article_metadata(
        {"preview_image_url": "notaurl"},
        article,
        enrichment,
    )
    assert metadata["preview_image_url"] is None
