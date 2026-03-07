import json
import os
import time
from datetime import datetime, timezone
from urllib.error import HTTPError
from urllib.parse import quote

from app.ingestion.base import IngestionSource, RawArticleCandidate
from app.ingestion.http_client import get_text

GDELT_URL = "https://api.gdeltproject.org/api/v2/doc/doc"
GDELT_USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
)


class GdeltSource(IngestionSource):
    source_name = "gdelt"
    _cooldown_until_epoch = 0.0

    def __init__(self, query: str, region_countries: list[str]):
        self.query = query
        self.region_countries = region_countries

    def fetch(self, max_items: int) -> list[RawArticleCandidate]:
        now_epoch = time.time()
        if now_epoch < self.__class__._cooldown_until_epoch:
            return []

        countries = " OR ".join([f"sourcecountry:{c}" for c in self.region_countries])
        full_query = f"({self.query}) ({countries})"
        url = (
            f"{GDELT_URL}?query={quote(full_query)}&mode=ArtList"
            f"&maxrecords={max_items}&format=json"
        )
        user_agent = os.getenv("HTTP_USER_AGENT", GDELT_USER_AGENT).strip() or GDELT_USER_AGENT
        retries = max(0, int(os.getenv("GDELT_MAX_RETRIES", "1")))
        retry_backoff_sec = max(0, int(os.getenv("GDELT_RETRY_BACKOFF_SECONDS", "5")))
        cooldown_sec = max(1, int(os.getenv("GDELT_429_COOLDOWN_SECONDS", "300")))

        text = ""
        attempts = retries + 1
        for attempt in range(attempts):
            try:
                text = get_text(
                    url,
                    headers={
                        "User-Agent": user_agent,
                        "Accept": "application/json,text/plain,*/*",
                    },
                )
                break
            except HTTPError as err:
                if err.code != 429:
                    raise
                if attempt < attempts - 1:
                    if retry_backoff_sec:
                        time.sleep(retry_backoff_sec)
                    continue
                self.__class__._cooldown_until_epoch = time.time() + cooldown_sec
                return []

        if text.startswith("Please limit requests"):
            self.__class__._cooldown_until_epoch = time.time() + cooldown_sec
            return []

        payload = json.loads(text)
        items = payload.get("articles", [])
        candidates = []
        for item in items:
            source_url = (item.get("url") or "").strip()
            title = (item.get("title") or "").strip()
            if not source_url or not title:
                continue

            seen = item.get("seendate")
            try:
                published_at = datetime.strptime(seen, "%Y%m%dT%H%M%SZ")
            except Exception:
                published_at = datetime.now(timezone.utc).replace(tzinfo=None)

            candidates.append(
                RawArticleCandidate(
                    source="gdelt",
                    source_url=source_url,
                    headline=title,
                    body=title,
                    published_at=published_at,
                    external_id=source_url,
                    region_tags=[(item.get("sourcecountry") or "").strip() or "US"],
                )
            )
        return candidates
