from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, as_completed
import os
import time
from datetime import datetime, timedelta

from apscheduler.schedulers.background import BackgroundScheduler
import requests

from models import ResearchFinding, ResearchTask, RiskEvent, db
from services.adk_agent import enrich_news_event
from services.ingestion_gdelt import DEFAULT_QUERY, poll_gdelt
from services.ingestion_weather import poll_weather

scheduler = BackgroundScheduler()
_gdelt_cooldown_until: datetime | None = None


DEMO_WAYPOINTS = [
    {"code": "CNSHA", "country": "CN", "lat": 31.4, "lon": 121.8},
    {"code": "USLAX", "country": "US", "lat": 33.7, "lon": -118.2},
    {"code": "USSEA", "country": "US", "lat": 47.6, "lon": -122.3},
]


def _normalize_severity(value, default: int) -> int:
    if isinstance(value, (int, float)):
        return max(0, min(100, int(value)))
    if isinstance(value, str):
        text = value.strip().lower()
        mapping = {
            "negligible": 10,
            "very low": 15,
            "low": 30,
            "moderate": 50,
            "medium": 50,
            "elevated": 65,
            "high": 80,
            "severe": 90,
            "critical": 95,
        }
        if text in mapping:
            return mapping[text]
        try:
            return max(0, min(100, int(float(text))))
        except ValueError:
            return default
    return default


def _normalize_confidence(value, default: float) -> float:
    if isinstance(value, (int, float)):
        return max(0.0, min(1.0, float(value)))
    if isinstance(value, str):
        text = value.strip().lower().replace("%", "")
        try:
            parsed = float(text)
            if parsed > 1.0:
                parsed = parsed / 100.0
            return max(0.0, min(1.0, parsed))
        except ValueError:
            return default
    return default


def poll_weather_job() -> int:
    return poll_weather(DEMO_WAYPOINTS, forecast_days=7)


def _is_rate_limit_error(exc: Exception) -> bool:
    if isinstance(exc, requests.exceptions.HTTPError) and exc.response is not None:
        return exc.response.status_code == 429
    return "429" in str(exc)


def run_gdelt_cycle(startup: bool = False, sleep_fn=time.sleep) -> dict:
    global _gdelt_cooldown_until

    now = datetime.utcnow()
    cooldown_seconds = int(os.getenv("GDELT_429_COOLDOWN_SECONDS", "900"))
    if _gdelt_cooldown_until and now < _gdelt_cooldown_until:
        wait_seconds = int((_gdelt_cooldown_until - now).total_seconds())
        print(f"gdelt_429_cooldown_active=true wait_seconds={wait_seconds}")
        return {"created_main": 0, "created_followup": 0, "total_created": 0, "error": "cooldown"}

    main_query = os.getenv("GDELT_MAIN_QUERY", os.getenv("GDELT_STARTUP_QUERY", DEFAULT_QUERY))
    followup_query = os.getenv(
        "GDELT_FOLLOWUP_QUERY",
        "maritime OR shipping OR port congestion OR logistics disruption",
    )
    timeout_seconds = int(os.getenv("GDELT_READ_TIMEOUT_SECONDS", "300"))
    main_default = os.getenv("GDELT_STARTUP_MAX_RECORDS", "50") if startup else os.getenv(
        "GDELT_POLL_MAX_RECORDS", "50"
    )
    main_max_records = int(os.getenv("GDELT_MAIN_MAX_RECORDS", main_default))
    followup_max_records = int(os.getenv("GDELT_FOLLOWUP_MAX_RECORDS", "25"))
    followup_delay_seconds = int(os.getenv("GDELT_FOLLOWUP_DELAY_SECONDS", "10"))

    created_main = 0
    created_followup = 0
    error = None

    print(
        f"gdelt_stage=main query={main_query} maxrecords={main_max_records} timeout_s={timeout_seconds}"
    )
    try:
        created_main = poll_gdelt(
            queries=[main_query],
            max_records=main_max_records,
            timeout_seconds=timeout_seconds,
        )
    except Exception as exc:
        error = str(exc)
        if _is_rate_limit_error(exc):
            _gdelt_cooldown_until = datetime.utcnow() + timedelta(seconds=cooldown_seconds)
        print(f"gdelt_stage=main_error error={error}")
        return {
            "created_main": created_main,
            "created_followup": created_followup,
            "total_created": created_main + created_followup,
            "error": error,
        }

    if followup_delay_seconds > 0:
        sleep_fn(followup_delay_seconds)

    print(
        f"gdelt_stage=followup query={followup_query} maxrecords={followup_max_records} timeout_s={timeout_seconds} delay_s={followup_delay_seconds}"
    )
    try:
        created_followup = poll_gdelt(
            queries=[followup_query],
            max_records=followup_max_records,
            timeout_seconds=timeout_seconds,
        )
    except Exception as exc:
        error = str(exc)
        if _is_rate_limit_error(exc):
            _gdelt_cooldown_until = datetime.utcnow() + timedelta(seconds=cooldown_seconds)
        print(f"gdelt_stage=followup_error error={error}")

    total_created = created_main + created_followup
    print(
        f"gdelt_created main={created_main} followup={created_followup} total={total_created}"
    )
    return {
        "created_main": created_main,
        "created_followup": created_followup,
        "total_created": total_created,
        "error": error,
    }


def poll_gdelt_job() -> int:
    result = run_gdelt_cycle(startup=False)
    return result["total_created"]


def _safe_parse_iso(value: str):
    if not value:
        return None
    normalized = value.strip()
    if normalized.endswith("Z"):
        normalized = normalized.replace("Z", "+00:00")
    return datetime.fromisoformat(normalized)


def _enrich_task_payload(task_id: int, url: str, title: str, snippet: str) -> dict:
    started = time.monotonic()
    finding = enrich_news_event(url=url, title=title, snippet=snippet)
    return {
        "task_id": task_id,
        "finding": finding,
        "latency_ms": int((time.monotonic() - started) * 1000),
    }


def process_research_tasks() -> int:
    max_workers = max(1, int(os.getenv("ENRICHMENT_MAX_WORKERS", "50")))
    batch_size = max(1, int(os.getenv("ENRICHMENT_BATCH_SIZE", "200")))
    max_batch_loops = max(1, int(os.getenv("ENRICHMENT_MAX_BATCH_LOOPS", "5")))
    processed = 0

    for _ in range(max_batch_loops):
        tasks = (
            ResearchTask.query.filter_by(status="queued")
            .order_by(ResearchTask.id.asc())
            .limit(batch_size)
            .all()
        )
        if not tasks:
            break

        task_by_id = {task.id: task for task in tasks}
        for task in tasks:
            task.status = "running"
            task.error = None
        db.session.commit()

        event_ids = [task.event_id for task in tasks]
        events = RiskEvent.query.filter(RiskEvent.id.in_(event_ids)).all()
        event_by_id = {event.id: event for event in events}

        work_items = []
        for task in tasks:
            event = event_by_id.get(task.event_id)
            if not event:
                task.status = "failed"
                task.error = "Event not found"
                continue
            work_items.append(
                {
                    "task_id": task.id,
                    "event_id": event.id,
                    "url": event.source_url or "",
                    "title": event.title,
                    "snippet": event.summary,
                }
            )
        db.session.commit()

        results = []
        if work_items:
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                future_map = {
                    executor.submit(
                        _enrich_task_payload,
                        item["task_id"],
                        item["url"],
                        item["title"],
                        item["snippet"],
                    ): item["task_id"]
                    for item in work_items
                }
                for future in as_completed(future_map):
                    task_id = future_map[future]
                    try:
                        results.append(future.result())
                    except Exception as exc:
                        results.append({"task_id": task_id, "error": str(exc)})

        for result in results:
            task = task_by_id.get(result["task_id"])
            if not task:
                continue

            event = event_by_id.get(task.event_id)
            if not event:
                task.status = "failed"
                task.error = "Event not found"
                continue

            if result.get("error"):
                task.status = "failed"
                task.error = result["error"]
                continue

            try:
                finding = result["finding"]
                db.session.add(
                    ResearchFinding(
                        task_id=task.id,
                        event_id=event.id,
                        finding_json=finding,
                    )
                )

                finding_meta = finding.get("_meta", {}) if isinstance(finding, dict) else {}
                is_relevant = finding_meta.get("is_relevant", True)
                if not is_relevant:
                    task.status = "done"
                    task.error = None
                    processed += 1
                    continue

                event.summary = finding.get("summary", event.summary)
                event.severity = _normalize_severity(finding.get("severity"), event.severity)
                event.confidence = _normalize_confidence(
                    finding.get("confidence"), float(event.confidence or 0.5)
                )

                impacted = finding.get("impacted")
                if not isinstance(impacted, dict):
                    impacted = {}
                event.impacted_ports = impacted.get("ports", []) if isinstance(
                    impacted.get("ports", []), list
                ) else []
                event.impacted_countries = impacted.get("countries", []) if isinstance(
                    impacted.get("countries", []), list
                ) else []
                event.impacted_keywords = impacted.get("keywords", []) if isinstance(
                    impacted.get("keywords", []), list
                ) else []

                tw = finding.get("time_window", {})
                if not isinstance(tw, dict):
                    tw = {}
                start = tw.get("start")
                end = tw.get("end")
                if start:
                    event.time_window_start = _safe_parse_iso(start)
                if end:
                    event.time_window_end = _safe_parse_iso(end)

                task.status = "done"
                task.error = None
                processed += 1
            except Exception as exc:
                task.status = "failed"
                task.error = str(exc)

        db.session.commit()

    return processed


def init_scheduler(app):
    if scheduler.running:
        return scheduler

    def _with_context(func):
        def wrapper():
            with app.app_context():
                func()

        return wrapper

    scheduler.add_job(_with_context(poll_weather_job), "interval", minutes=15, id="poll_weather")
    scheduler.add_job(_with_context(poll_gdelt_job), "interval", minutes=10, id="poll_gdelt")
    scheduler.add_job(
        _with_context(process_research_tasks),
        "interval",
        minutes=1,
        id="process_research",
        max_instances=1,
        coalesce=True,
    )
    scheduler.start()
    return scheduler
