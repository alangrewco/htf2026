from datetime import datetime

from models import ResearchFinding, ResearchTask, RiskEvent, db


def _make_event(dedupe_key: str, event_type: str = "NEWS", severity: int = 60) -> RiskEvent:
    return RiskEvent(
        event_type=event_type,
        title=f"event-{dedupe_key}",
        summary="bulk test",
        severity=severity,
        confidence=0.5,
        source="gdelt",
        source_url=f"https://example.com/{dedupe_key}",
        published_at=datetime(2026, 3, 3),
        impacted_ports=[],
        impacted_countries=[],
        impacted_keywords=[],
        dedupe_key=dedupe_key,
        metadata_json={},
    )


def test_bulk_enqueue_defaults_to_unenriched_news_only(client, app):
    with app.app_context():
        news_unenriched = _make_event("bulk-default-news-unenriched", event_type="NEWS")
        news_enriched = _make_event("bulk-default-news-enriched", event_type="NEWS")
        weather_unenriched = _make_event("bulk-default-weather-unenriched", event_type="WEATHER")
        db.session.add_all([news_unenriched, news_enriched, weather_unenriched])
        db.session.flush()

        done_task = ResearchTask(event_id=news_enriched.id, mode="enrich", status="done")
        db.session.add(done_task)
        db.session.flush()
        db.session.add(
            ResearchFinding(
                task_id=done_task.id,
                event_id=news_enriched.id,
                finding_json={"summary": "already enriched"},
            )
        )
        db.session.commit()

        target_event_id = news_unenriched.id

    resp = client.post("/api/research/tasks/bulk", json={})
    assert resp.status_code == 200
    payload = resp.get_json()

    assert payload["candidate_count"] == 1
    assert payload["created_count"] == 1
    assert payload["skipped_already_enriched"] == 0
    assert payload["skipped_duplicate_task"] == 0

    with app.app_context():
        queued = (
            ResearchTask.query.filter_by(status="queued")
            .order_by(ResearchTask.id.asc())
            .all()
        )
        assert len(queued) == 1
        assert queued[0].event_id == target_event_id


def test_bulk_enqueue_skips_duplicate_active_tasks(client, app):
    with app.app_context():
        event = _make_event("bulk-duplicate-news", event_type="NEWS")
        db.session.add(event)
        db.session.flush()
        db.session.add(ResearchTask(event_id=event.id, mode="enrich", status="queued"))
        db.session.commit()

    resp = client.post("/api/research/tasks/bulk", json={})
    assert resp.status_code == 200
    payload = resp.get_json()
    assert payload["candidate_count"] == 1
    assert payload["created_count"] == 0
    assert payload["skipped_duplicate_task"] == 1


def test_bulk_enqueue_with_event_ids_and_filter_union(client, app):
    with app.app_context():
        news_unenriched = _make_event("bulk-union-news-unenriched", event_type="NEWS")
        weather_unenriched = _make_event("bulk-union-weather-unenriched", event_type="WEATHER")
        news_enriched = _make_event("bulk-union-news-enriched", event_type="NEWS")
        db.session.add_all([news_unenriched, weather_unenriched, news_enriched])
        db.session.flush()

        done_task = ResearchTask(event_id=news_enriched.id, mode="enrich", status="done")
        db.session.add(done_task)
        db.session.flush()
        db.session.add(
            ResearchFinding(
                task_id=done_task.id,
                event_id=news_enriched.id,
                finding_json={"summary": "already enriched"},
            )
        )
        db.session.commit()

        payload = {
            "mode": "enrich",
            "event_ids": [weather_unenriched.id, news_enriched.id, 999999],
            "filter": {
                "event_type": "NEWS",
                "min_severity": 0,
                "limit": 1000,
                "only_unenriched": True,
            },
        }

        expected_created = {news_unenriched.id, weather_unenriched.id}
        enriched_id = news_enriched.id

    resp = client.post("/api/research/tasks/bulk", json=payload)
    assert resp.status_code == 200
    body = resp.get_json()

    assert body["requested_count"] == 3
    assert body["candidate_count"] == 3
    assert body["created_count"] == 2
    assert body["skipped_already_enriched"] == 1
    assert body["invalid_event_ids"] == [999999]

    with app.app_context():
        queued = ResearchTask.query.filter_by(status="queued").all()
        queued_event_ids = {task.event_id for task in queued}
        assert queued_event_ids == expected_created
        assert enriched_id not in queued_event_ids
