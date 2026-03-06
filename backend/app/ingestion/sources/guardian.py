from datetime import datetime, timezone
from urllib.parse import quote

from app.ingestion.base import IngestionSource, RawArticleCandidate
from app.ingestion.http_client import get_json

GUARDIAN_URL = "https://content.guardianapis.com/search"


class GuardianSource(IngestionSource):
    source_name = "guardian"

    def __init__(self, api_key: str, query: str):
        self.api_key = api_key
        self.query = query

    def fetch(self, max_items: int) -> list[RawArticleCandidate]:
        url = (
            f"{GUARDIAN_URL}?q={quote(self.query)}&api-key={quote(self.api_key)}"
            f"&page-size={max_items}&show-fields=headline,trailText,bodyText"
        )
        payload = get_json(url, headers={"Accept": "application/json"})
        response = payload.get("response", {})
        items = response.get("results", [])

        candidates = []
        for item in items:
            source_url = (item.get("webUrl") or "").strip()
            headline = (item.get("webTitle") or "").strip()
            if not source_url or not headline:
                continue

            published_raw = item.get("webPublicationDate")
            try:
                published_at = datetime.fromisoformat(published_raw.replace("Z", "+00:00")).replace(tzinfo=None)
            except Exception:
                published_at = datetime.now(timezone.utc).replace(tzinfo=None)

            fields = item.get("fields", {})
            body = (fields.get("trailText") or fields.get("bodyText") or headline).strip()

            candidates.append(
                RawArticleCandidate(
                    source="guardian",
                    source_url=source_url,
                    headline=headline,
                    body=body,
                    published_at=published_at,
                    external_id=item.get("id"),
                    region_tags=["US", "CA"],
                )
            )
        return candidates
