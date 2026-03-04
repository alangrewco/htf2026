import os
import json
from datetime import datetime

import pytest

from jobs import process_research_tasks
from models import RiskEvent, db


pytestmark = pytest.mark.live_gemini


def _live_enabled() -> bool:
    return os.getenv("RUN_LIVE_GEMINI_TESTS", "0") == "1"


def _has_key() -> bool:
    return bool(os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY"))


@pytest.mark.live_gemini
def test_e2e_live_gemini_flow(client, app):
    if not _live_enabled():
        pytest.skip("Set RUN_LIVE_GEMINI_TESTS=1 to run live Gemini E2E test.")
    if not _has_key():
        pytest.skip("Set GOOGLE_API_KEY or GEMINI_API_KEY for live Gemini E2E test.")

    with app.app_context():
        db.session.add_all(
            [
                RiskEvent(
                    event_type="NEWS",
                    title="Port strike threat at Los Angeles terminal",
                    summary="Labor groups announced potential strike action next week at US west coast terminals.",
                    severity=40,
                    confidence=0.5,
                    source="manual-test",
                    source_url="https://example.com/live-e2e-1",
                    published_at=datetime(2026, 3, 4, 0, 0, 0),
                    impacted_ports=[],
                    impacted_countries=[],
                    impacted_keywords=["strike"],
                    dedupe_key="live-e2e-news-1",
                    metadata_json={},
                ),
                RiskEvent(
                    event_type="NEWS",
                    title="Typhoon reroutes vessels in East Asia",
                    summary="Weather disruptions are forcing carriers to reroute and delay transpacific departures.",
                    severity=45,
                    confidence=0.5,
                    source="manual-test",
                    source_url="https://example.com/live-e2e-2",
                    published_at=datetime(2026, 3, 4, 0, 5, 0),
                    impacted_ports=[],
                    impacted_countries=[],
                    impacted_keywords=["typhoon", "reroute"],
                    dedupe_key="live-e2e-news-2",
                    metadata_json={},
                ),
            ]
        )
        db.session.commit()

    bulk_resp = client.post(
        "/api/research/tasks/bulk",
        json={
            "mode": "enrich",
            "filter": {
                "event_type": "NEWS",
                "min_severity": 0,
                "limit": 20,
                "only_unenriched": False,
            },
        },
    )
    assert bulk_resp.status_code == 200
    bulk_payload = bulk_resp.get_json()
    assert bulk_payload["created_count"] > 0
    task_ids = bulk_payload["created_task_ids"]
    assert task_ids

    with app.app_context():
        processed = process_research_tasks()
        assert processed > 0

    terminal_statuses = []
    traces = []
    for task_id in task_ids:
        task_resp = client.get(f"/api/research/tasks/{task_id}")
        assert task_resp.status_code == 200
        task_payload = task_resp.get_json()
        terminal_statuses.append(task_payload["status"])

        trace_resp = client.get(f"/api/research/tasks/{task_id}/trace")
        assert trace_resp.status_code == 200
        trace = trace_resp.get_json()
        assert trace["task_id"] == task_id
        assert trace["agent_path"] == "relevance->impact->action"
        assert trace["stage_status"] is not None
        assert "relevance" in trace["stage_status"]
        traces.append(trace)

        # Force visible stage-by-stage output when running with -s
        print(f"\n=== TASK {task_id} TRACE ===")
        print(json.dumps(trace.get("stage_status"), indent=2, ensure_ascii=False))
        print("--- relevance_raw ---")
        print(
            json.dumps(
                ((trace.get("stage_outputs") or {}).get("relevance_raw")),
                indent=2,
                ensure_ascii=False,
            )
        )
        print("--- impact_raw ---")
        print(
            json.dumps(
                ((trace.get("stage_outputs") or {}).get("impact_raw")),
                indent=2,
                ensure_ascii=False,
            )
        )
        print("--- action_raw ---")
        print(
            json.dumps(
                ((trace.get("stage_outputs") or {}).get("action_raw")),
                indent=2,
                ensure_ascii=False,
            )
        )
    assert any(status == "done" for status in terminal_statuses)
    assert all(status in {"done", "failed"} for status in terminal_statuses)
    assert any(
        (
            (t.get("stage_outputs") or {}).get("relevance_raw") is not None
            and (t.get("stage_outputs") or {}).get("impact_raw") is not None
            and (t.get("stage_outputs") or {}).get("action_raw") is not None
        )
        for t in traces
        if t.get("status") == "done"
    )

    findings_resp = client.get("/api/research/findings")
    assert findings_resp.status_code == 200
    findings = findings_resp.get_json()
    assert findings

    recent_task_ids = set(task_ids)
    recent_findings = [row for row in findings if row["task_id"] in recent_task_ids]
    assert recent_findings

    sources = {
        (row["finding_json"].get("_meta") or {}).get("enrichment_source")
        for row in recent_findings
    }
    assert sources.issubset({"adk", "fallback", None})
    for row in recent_findings:
        meta = row["finding_json"].get("_meta") or {}
        assert meta.get("agent_path") == "relevance->impact->action"
        assert ((meta.get("stage_outputs") or {}).get("relevance_raw")) is not None
        assert ((meta.get("stage_outputs") or {}).get("impact_raw")) is not None
        assert ((meta.get("stage_outputs") or {}).get("action_raw")) is not None

    if os.getenv("REQUIRE_ADK_SOURCE", "0") == "1":
        assert "adk" in sources

    event_id = recent_findings[0]["event_id"]
    event_resp = client.get(f"/api/events/{event_id}")
    assert event_resp.status_code == 200
    event_payload = event_resp.get_json()
    assert event_payload["event_type"] == "NEWS"
    assert event_payload["summary"]

    pref_before_resp = client.get("/api/preferences")
    assert pref_before_resp.status_code == 200
    pref_before = pref_before_resp.get_json()
    w_cost_before = pref_before["w_cost"]

    rec_resp = client.post(
        "/api/recommendations/generate",
        json={"profile": "resilient", "sku_ids": [1, 2], "horizon_days": 30},
    )
    assert rec_resp.status_code == 200
    rec_payload = rec_resp.get_json()
    assert rec_payload["recommendations"]
    rec_id = rec_payload["recommendations"][0]["id"]
    assert "evidence_summary" in rec_payload["recommendations"][0]["recommendation"]

    feedback_resp = client.post(
        f"/api/recommendations/{rec_id}/feedback",
        json={"accepted": False, "reason_code": "too_expensive"},
    )
    assert feedback_resp.status_code == 200

    pref_after_resp = client.get("/api/preferences")
    assert pref_after_resp.status_code == 200
    pref_after = pref_after_resp.get_json()
    assert pref_after["w_cost"] > w_cost_before
    total = pref_after["w_cost"] + pref_after["w_speed"] + pref_after["w_risk"]
    assert abs(total - 1.0) < 1e-9

    rec2_resp = client.post(
        "/api/recommendations/generate",
        json={"profile": "resilient", "sku_ids": [1, 2], "horizon_days": 30},
    )
    assert rec2_resp.status_code == 200
    rec2_payload = rec2_resp.get_json()
    assert rec2_payload["weights"]["w_cost"] != rec_payload["weights"]["w_cost"]
