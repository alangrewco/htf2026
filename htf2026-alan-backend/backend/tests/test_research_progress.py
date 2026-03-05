import json
from datetime import datetime

from models import ResearchTask, RiskEvent, db


def _seed_event(app):
    with app.app_context():
        event = RiskEvent(
            event_type="NEWS",
            title="Progress seed event",
            summary="Used for research progress tests",
            severity=60,
            confidence=0.7,
            source="gdelt",
            source_url="https://example.com/progress-seed",
            published_at=datetime(2026, 3, 3),
            impacted_ports=[],
            impacted_countries=[],
            impacted_keywords=["port"],
            dedupe_key="progress-seed-event",
            metadata_json={},
        )
        db.session.add(event)
        db.session.commit()
        return event.id


def test_research_progress_snapshot(client, app):
    event_id = _seed_event(app)

    with app.app_context():
        db.session.add_all(
            [
                ResearchTask(event_id=event_id, mode="enrich", status="queued"),
                ResearchTask(event_id=event_id, mode="enrich", status="running"),
                ResearchTask(event_id=event_id, mode="enrich", status="done"),
                ResearchTask(
                    event_id=event_id,
                    mode="enrich",
                    status="failed",
                    error="network timeout",
                ),
            ]
        )
        db.session.commit()

    resp = client.get("/api/research/progress")
    assert resp.status_code == 200
    payload = resp.get_json()
    assert payload["queued"] == 1
    assert payload["running"] == 1
    assert payload["done"] == 1
    assert payload["failed"] == 1
    assert payload["total"] == 4
    assert payload["worker_config"]["max_workers"] >= 1
    assert payload["worker_config"]["batch_size"] >= 1
    assert len(payload["recent_failures"]) == 1
    assert payload["recent_failures"][0]["error"] == "network timeout"


def test_research_progress_stream_sse(client, app):
    event_id = _seed_event(app)
    with app.app_context():
        db.session.add(ResearchTask(event_id=event_id, mode="enrich", status="queued"))
        db.session.commit()

    resp = client.get("/api/research/stream/progress?interval_seconds=1", buffered=False)
    chunk = next(resp.response).decode("utf-8")

    assert "event: progress_snapshot" in chunk
    assert "data: " in chunk
    data_line = [line for line in chunk.splitlines() if line.startswith("data: ")][0]
    payload = json.loads(data_line.replace("data: ", "", 1))
    assert payload["queued"] >= 1
    assert "worker_config" in payload
