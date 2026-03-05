from __future__ import annotations

import os
import re
from datetime import datetime
from hashlib import sha1

import requests

from models import RiskEvent, db


GDELT_DOC_URL = "https://api.gdeltproject.org/api/v2/doc/doc"
DEFAULT_QUERIES = [
    "port strike Asia",
    "shipping congestion Los Angeles",
    "election disruption trade Asia",
    "South China Sea shipping",
]
DEFAULT_QUERY = DEFAULT_QUERIES[0]
DEFAULT_HTTP_HEADERS = {
    "User-Agent": os.getenv(
        "HTTP_USER_AGENT",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    ),
    "Accept": "application/json",
}


def normalize_title(title: str) -> str:
    cleaned = (title or "").lower()
    cleaned = re.sub(r"[^a-z0-9\s]", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def poll_gdelt(
    queries: list[str] | None = None,
    max_records: int = 50,
    timeout_seconds: int = 300,
) -> int:
    created = 0
    query_set = queries or [DEFAULT_QUERY]

    for query in query_set:
        params = {
            "query": query,
            "mode": "ArtList",
            "format": "json",
            "maxrecords": max_records,
            "sort": "DateDesc",
        }
        response = requests.get(
            GDELT_DOC_URL,
            params=params,
            timeout=timeout_seconds,
            headers=DEFAULT_HTTP_HEADERS,
        )
        response.raise_for_status()
        payload = response.json()
        for article in payload.get("articles", []):
            url = article.get("url")
            seendate = article.get("seendate", "")
            title = article.get("title") or "Untitled"
            snippet = article.get("seendate", "")

            normalized_title = normalize_title(title)
            if not normalized_title:
                continue

            dedupe_key = f"news_title:{sha1(normalized_title.encode('utf-8')).hexdigest()}"
            if RiskEvent.query.filter_by(dedupe_key=dedupe_key).first():
                continue

            published_at = None
            if seendate:
                try:
                    published_at = datetime.strptime(seendate, "%Y%m%dT%H%M%SZ")
                except ValueError:
                    published_at = datetime.utcnow()

            event = RiskEvent(
                event_type="NEWS",
                title=title[:255],
                summary=snippet or "GDELT detected relevant maritime logistics signal.",
                severity=60,
                confidence=0.5,
                source="gdelt",
                source_url=url,
                published_at=published_at,
                impacted_ports=[],
                impacted_countries=[],
                impacted_keywords=["news", "supply chain"],
                dedupe_key=dedupe_key,
                metadata_json={"query": query},
            )
            db.session.add(event)
            created += 1

    db.session.commit()
    return created
