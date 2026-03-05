"""
Live Signals Blueprint — RSS proxy for the frontend LiveSignalsPanel
=====================================================================
Ported from WorldMonitor's RSS proxy approach. Fetches maritime/logistics
RSS feeds and returns structured signal items. Avoids CORS issues by
proxying through the backend.

Also includes keyword monitoring: clients POST keywords and the backend
filters signals server-side.
"""

from __future__ import annotations

import re
from email.utils import parsedate_to_datetime
from hashlib import sha1
import os
from xml.etree import ElementTree

import requests
from flask import abort, request
from flask.views import MethodView
from flask_smorest import Blueprint
from marshmallow import Schema, fields

from extensions import limiter

blp = Blueprint("signals", __name__, url_prefix="/api/signals", description="Live signals")

# Maritime/supply-chain RSS feeds (from WorldMonitor + additions)
DEFAULT_SIGNAL_FEEDS = [
    "https://www.maritime-executive.com/rss",
    "https://gcaptain.com/feed/",
    "https://www.seatrade-maritime.com/rss.xml",
    "https://www.joc.com/rss/all",
    "https://www.freightwaves.com/news/rss.xml",
]

HTTP_HEADERS = {
    "User-Agent": os.getenv(
        "HTTP_USER_AGENT",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    ),
    "Accept": "application/rss+xml, application/xml;q=0.9, */*;q=0.8",
}


def _safe_text(parent: ElementTree.Element, tag: str) -> str:
    node = parent.find(tag)
    if node is None or node.text is None:
        return ""
    return node.text.strip()


def _parse_pubdate(raw: str) -> str | None:
    if not raw:
        return None
    try:
        dt = parsedate_to_datetime(raw).replace(tzinfo=None)
        return dt.isoformat()
    except Exception:
        return None


def _feed_source_name(url: str) -> str:
    """Extract a readable source name from feed URL."""
    try:
        from urllib.parse import urlparse
        host = urlparse(url).hostname or url
        return host.replace("www.", "").split(".")[0].capitalize()
    except Exception:
        return "RSS"


def _fetch_signals(feeds: list[str] | None = None, max_per_feed: int = 15) -> list[dict]:
    """Fetch and parse RSS feeds, returning structured signal items."""
    feed_urls = feeds or DEFAULT_SIGNAL_FEEDS
    signals: list[dict] = []

    for feed_url in feed_urls:
        try:
            resp = requests.get(
                feed_url, timeout=15, headers=HTTP_HEADERS, allow_redirects=True
            )
            resp.raise_for_status()
            root = ElementTree.fromstring(resp.content)
            items = root.findall(".//item")[:max_per_feed]
        except Exception:
            continue

        source = _feed_source_name(feed_url)

        for item in items:
            title = _safe_text(item, "title") or "Untitled"
            link = _safe_text(item, "link")
            description = _safe_text(item, "description")
            pub_date = _safe_text(item, "pubDate")

            if not link:
                continue

            signals.append({
                "id": sha1(link.encode("utf-8")).hexdigest()[:12],
                "title": title[:255],
                "description": description[:500],
                "link": link,
                "source": source,
                "published_at": _parse_pubdate(pub_date),
            })

    # Sort by published_at descending (most recent first)
    signals.sort(key=lambda s: s.get("published_at") or "", reverse=True)
    return signals


def _filter_by_keywords(signals: list[dict], keywords: list[str]) -> list[dict]:
    """
    Filter signals by keywords using word-boundary matching.
    Ported from WorldMonitor's MonitorPanel regex approach.
    """
    if not keywords:
        return signals

    patterns = []
    for kw in keywords:
        escaped = re.escape(kw.strip().lower())
        patterns.append(re.compile(rf"\b{escaped}\b", re.IGNORECASE))

    matched = []
    for signal in signals:
        search_text = f"{signal.get('title', '')} {signal.get('description', '')}"
        if any(p.search(search_text) for p in patterns):
            # Find which keywords matched
            hits = [kw for kw, p in zip(keywords, patterns) if p.search(search_text)]
            matched.append({**signal, "matched_keywords": hits})

    return matched


# ── Schemas ──────────────────────────────────────────────────────────────

class SignalQuerySchema(Schema):
    keywords = fields.String(required=False, load_default="")
    limit = fields.Integer(required=False, load_default=50)


# ── Routes ───────────────────────────────────────────────────────────────

@blp.route("")
class SignalsListResource(MethodView):
    decorators = [limiter.limit("30/minute")]

    @blp.arguments(SignalQuerySchema, location="query")
    @blp.doc(tags=["signals"])
    def get(self, args):
        """
        Fetch live RSS signals from maritime/logistics feeds.
        Optional: pass ?keywords=strike,port,delay to filter.
        """
        signals = _fetch_signals()

        # Keyword filtering
        kw_str = args.get("keywords", "")
        if kw_str:
            keywords = [k.strip() for k in kw_str.split(",") if k.strip()]
            signals = _filter_by_keywords(signals, keywords)

        limit = args.get("limit", 50)
        return {
            "signals": signals[:limit],
            "total": len(signals),
            "feeds_count": len(DEFAULT_SIGNAL_FEEDS),
        }


@blp.route("/detect")
class SignalsDetectResource(MethodView):
    decorators = [limiter.limit("5/minute")]

    @blp.doc(tags=["signals"])
    def post(self):
        """
        Classify a news headline as a potential disruption.
        Uses the perception service (LLM or keyword fallback).
        """
        data = request.get_json(silent=True) or {}
        headline = data.get("headline", "")[:500]   # Cap input length
        body = data.get("body", "")[:5000]            # Cap input length

        if not headline:
            abort(400, description="headline is required")

        from services.perception import classify_news, detect_and_create

        classification = classify_news(headline, body)

        # If disruption detected, optionally create a Disruption record
        disruption = None
        if classification.get("is_disruption") and data.get("auto_create", False):
            disruption = detect_and_create(headline, body)

        return {
            "classification": classification,
            "created_disruption_id": disruption.id if disruption else None,
        }
