from __future__ import annotations

from datetime import datetime
from hashlib import sha1

from flask import abort, current_app
from flask.views import MethodView
from flask_smorest import Blueprint

from models import RiskEvent, db
from schemas import (
    AdminIngestionPollResponseSchema,
    AdminIngestionPollSchema,
    AdminMockNewsCreateResponseSchema,
    AdminMockNewsCreateSchema,
    AdminMockNewsDefaultRequestSchema,
    AdminMockNewsDefaultResponseSchema,
)
from services.ingestion_gdelt import DEFAULT_QUERY, normalize_title, poll_gdelt
from services.ingestion_weather import poll_weather

blp = Blueprint("admin", __name__, url_prefix="/api/admin", description="Admin")


DEFAULT_MOCK_ARTICLES = [
    {
        "title": "Shenzhen export terminal labor slowdown delays feeder schedules",
        "summary": "Union-led slowdown at Yantian and Shekou terminals is extending berth times by 18-24 hours.",
        "source_url": "https://example.com/mock/yantian-slowdown",
        "severity": 68,
        "impacted_ports": ["CNSHA"],
        "impacted_countries": ["CN"],
        "impacted_keywords": ["labor", "terminal", "delay"],
    },
    {
        "title": "Typhoon corridor warning issued for East China Sea transpacific lanes",
        "summary": "Carriers advised to reroute around severe weather in East China Sea over next 72 hours.",
        "source_url": "https://example.com/mock/typhoon-east-china-sea",
        "severity": 74,
        "impacted_ports": ["CNSHA"],
        "impacted_countries": ["CN", "US"],
        "impacted_keywords": ["weather", "reroute", "transpacific"],
    },
    {
        "title": "Oakland rail intermodal backlog increases container dwell time",
        "summary": "Intermodal handoff congestion pushes average dwell time above five days in Oakland network.",
        "source_url": "https://example.com/mock/oakland-rail-backlog",
        "severity": 61,
        "impacted_ports": ["USLAX"],
        "impacted_countries": ["US"],
        "impacted_keywords": ["intermodal", "rail", "congestion"],
    },
    {
        "title": "Carrier blank sailings announced on Asia-US West Coast service loop",
        "summary": "Two blank sailings announced this month for cost control and schedule recovery.",
        "source_url": "https://example.com/mock/blank-sailings",
        "severity": 59,
        "impacted_ports": ["CNSHA", "USLAX"],
        "impacted_countries": ["CN", "US"],
        "impacted_keywords": ["blank sailing", "capacity", "schedule"],
    },
    {
        "title": "US customs inspection surge slows drayage turnaround at LA/LB",
        "summary": "Increased inspection intensity at LA/LB is creating inland drayage dispatch delays.",
        "source_url": "https://example.com/mock/customs-inspection",
        "severity": 66,
        "impacted_ports": ["USLAX"],
        "impacted_countries": ["US"],
        "impacted_keywords": ["customs", "inspection", "drayage"],
    },
]


def _require_admin_enabled() -> None:
    if not current_app.config.get("ENABLE_ADMIN_API", False):
        abort(404, "Not found")


def _dedupe_key_from_title(title: str) -> str:
    normalized = normalize_title(title)
    if not normalized:
        normalized = title.strip().lower()
    return f"mock_news_title:{sha1(normalized.encode('utf-8')).hexdigest()}"


def _create_mock_articles(articles: list[dict], source: str, pack_name: str) -> dict:
    created_event_ids: list[int] = []
    skipped_duplicates = 0
    now = datetime.utcnow()

    for article in articles:
        title = article["title"].strip()
        dedupe_key = _dedupe_key_from_title(title)
        if RiskEvent.query.filter_by(dedupe_key=dedupe_key).first():
            skipped_duplicates += 1
            continue

        event = RiskEvent(
            event_type="NEWS",
            title=title[:255],
            summary=article["summary"],
            severity=article.get("severity", 50),
            confidence=article.get("confidence", 0.7),
            source=source,
            source_url=article["source_url"],
            published_at=article.get("published_at") or now,
            impacted_ports=article.get("impacted_ports", []),
            impacted_countries=article.get("impacted_countries", []),
            impacted_keywords=article.get("impacted_keywords", ["mock", "news"]),
            dedupe_key=dedupe_key,
            metadata_json={"mock": True, "pack_name": pack_name},
        )
        db.session.add(event)
        db.session.flush()
        created_event_ids.append(event.id)

    db.session.commit()
    return {
        "created_count": len(created_event_ids),
        "skipped_duplicates": skipped_duplicates,
        "created_event_ids": created_event_ids,
    }


@blp.route("/ingestion/poll")
class AdminIngestionPollResource(MethodView):
    @blp.arguments(AdminIngestionPollSchema)
    @blp.response(200, AdminIngestionPollResponseSchema)
    @blp.doc(tags=["admin"])
    def post(self, payload):
        _require_admin_enabled()

        weather_created = 0
        news_created = 0

        if payload["weather"]:
            from jobs import DEMO_WAYPOINTS

            weather_created = poll_weather(DEMO_WAYPOINTS, forecast_days=7)

        if payload["news"]:
            query = current_app.config.get("GDELT_MAIN_QUERY") or DEFAULT_QUERY
            max_records = payload.get("gdelt_max_records") or payload["news_target_count"]
            max_records = max(1, min(int(max_records), 50))
            news_created = poll_gdelt(queries=[query], max_records=max_records, timeout_seconds=120)

            if payload.get("include_followup"):
                followup_query = (
                    current_app.config.get("GDELT_FOLLOWUP_QUERY")
                    or "maritime OR shipping OR port congestion OR logistics disruption"
                )
                followup_created = poll_gdelt(
                    queries=[followup_query],
                    max_records=max(1, min(payload["news_target_count"], 20)),
                    timeout_seconds=120,
                )
                news_created += followup_created

        return {
            "weather_created": weather_created,
            "news_created": news_created,
            "total_created": weather_created + news_created,
            "source": "live",
            "details": {
                "news_target_count": payload["news_target_count"],
                "include_followup": payload.get("include_followup", False),
            },
        }


@blp.route("/events/mock-news")
class AdminMockNewsCreateResource(MethodView):
    @blp.arguments(AdminMockNewsCreateSchema)
    @blp.response(200, AdminMockNewsCreateResponseSchema)
    @blp.doc(tags=["admin"])
    def post(self, payload):
        _require_admin_enabled()
        return _create_mock_articles(
            articles=payload["articles"],
            source=payload["source"],
            pack_name=payload["pack_name"],
        )


@blp.route("/events/mock-news/default-set")
class AdminMockNewsDefaultSetResource(MethodView):
    @blp.arguments(AdminMockNewsDefaultRequestSchema)
    @blp.response(200, AdminMockNewsDefaultResponseSchema)
    @blp.doc(tags=["admin"])
    def post(self, payload):
        _require_admin_enabled()
        result = _create_mock_articles(
            articles=DEFAULT_MOCK_ARTICLES,
            source="mock",
            pack_name=payload["pack_name"],
        )
        return {"pack_name": payload["pack_name"], **result}
