from __future__ import annotations

import os
from datetime import datetime
from email.utils import parsedate_to_datetime
from hashlib import sha1
from xml.etree import ElementTree

import requests

from models import RiskEvent, db


DEFAULT_RSS_FEEDS = [
    "https://www.maritime-executive.com/rss",
    "https://www.seatrade-maritime.com/rss.xml",
    "https://gcaptain.com/feed/",
]
DEFAULT_HTTP_HEADERS = {
    "User-Agent": os.getenv(
        "HTTP_USER_AGENT",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    ),
    "Accept": "application/rss+xml, application/xml;q=0.9, */*;q=0.8",
}


def _safe_text(parent: ElementTree.Element, tag_name: str) -> str:
    node = parent.find(tag_name)
    if node is None or node.text is None:
        return ""
    return node.text.strip()


def _parse_pubdate(pub_date: str) -> datetime | None:
    if not pub_date:
        return None
    try:
        parsed = parsedate_to_datetime(pub_date)
        # store naive UTC-like timestamp for consistency with current schema
        return parsed.replace(tzinfo=None) if parsed.tzinfo else parsed
    except Exception:
        return None


def poll_rss(feeds: list[str] | None = None, max_items_per_feed: int = 25) -> int:
    created = 0
    feed_urls = feeds or DEFAULT_RSS_FEEDS

    for feed_url in feed_urls:
        try:
            response = requests.get(
                feed_url, timeout=20, headers=DEFAULT_HTTP_HEADERS, allow_redirects=True
            )
            response.raise_for_status()
            root = ElementTree.fromstring(response.content)
            items = root.findall(".//item")[:max_items_per_feed]
        except Exception as exc:
            print(f"rss_feed_error url={feed_url} error={exc}")
            continue

        for item in items:
            title = _safe_text(item, "title") or "Untitled RSS Event"
            link = _safe_text(item, "link")
            description = _safe_text(item, "description")
            pub_date = _safe_text(item, "pubDate")
            published_at = _parse_pubdate(pub_date)

            if not link:
                continue

            dedupe_key = f"rss:{sha1((link + (pub_date or '')).encode('utf-8')).hexdigest()}"
            if RiskEvent.query.filter_by(dedupe_key=dedupe_key).first():
                continue

            event = RiskEvent(
                event_type="NEWS",
                title=title[:255],
                summary=description[:1000] or "RSS detected relevant maritime signal.",
                severity=50,
                confidence=0.55,
                source="rss",
                source_url=link,
                published_at=published_at,
                impacted_ports=[],
                impacted_countries=[],
                impacted_keywords=["news", "rss", "shipping"],
                dedupe_key=dedupe_key,
                metadata_json={"feed_url": feed_url},
            )
            db.session.add(event)
            created += 1

    db.session.commit()
    return created
