from datetime import datetime, timezone

from app.ingestion.base import IngestionSource, RawArticleCandidate


class MockSource(IngestionSource):
    source_name = "mock"

    def fetch(self, max_items: int) -> list[RawArticleCandidate]:
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        samples = [
            RawArticleCandidate(
                source="mock",
                source_url="https://example.com/news/1",
                headline="Port congestion hits West Coast logistics",
                body="Delays expected for container shipments in US ports.",
                published_at=now,
                external_id="mock-1",
                region_tags=["US"],
            ),
            RawArticleCandidate(
                source="mock",
                source_url="https://example.com/news/1",
                headline="Port congestion hits West Coast logistics",
                body="Duplicate URL should dedupe.",
                published_at=now,
                external_id="mock-dup",
                region_tags=["US"],
            ),
            RawArticleCandidate(
                source="mock",
                source_url="https://example.com/news/2",
                headline="Rail strike raises supply chain disruption concerns",
                body="Shipment reroutes are under review.",
                published_at=now,
                external_id="mock-2",
                region_tags=["CA"],
            ),
        ]
        return samples[:max_items]
