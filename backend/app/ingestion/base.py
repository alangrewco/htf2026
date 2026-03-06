from dataclasses import dataclass
from datetime import datetime


@dataclass
class RawArticleCandidate:
    source: str
    source_url: str
    headline: str
    body: str
    published_at: datetime
    external_id: str | None = None
    region_tags: list[str] | None = None


class IngestionSource:
    source_name = "unknown"

    def fetch(self, max_items: int) -> list[RawArticleCandidate]:
        raise NotImplementedError
