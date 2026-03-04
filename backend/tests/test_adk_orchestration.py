from services.adk_agent import orchestrate_enrichment


def test_orchestration_runs_relevance_impact_action_in_order(monkeypatch):
    calls = []

    def fake_run_llm_json(*, agent_name, model_name, instruction, prompt):
        calls.append(agent_name)
        if agent_name == "relevance_agent":
            return {"is_relevant": True, "relevance_score": 0.9, "reason": "lane relevant"}, 10
        if agent_name == "impact_agent":
            return {
                "event_type": "NEWS",
                "title": "Impact title",
                "summary": "Impact summary",
                "severity": 78,
                "confidence": 0.84,
                "impacted": {"ports": ["USLAX"], "countries": ["US"], "keywords": ["strike"]},
                "time_window": {
                    "start": "2026-03-04T00:00:00",
                    "end": "2026-03-10T00:00:00",
                },
                "citations": [{"url": "https://example.com", "note": "src"}],
            }, 20
        if agent_name == "action_agent":
            return {
                "recommended_actions": [
                    {"action": "Reroute to Tacoma", "rationale": "Reduce expected delay"}
                ]
            }, 30
        raise AssertionError("unexpected agent")

    monkeypatch.setattr("services.adk_agent._run_llm_json", fake_run_llm_json)

    finding = orchestrate_enrichment(
        url="https://example.com/news", title="Port strike", snippet="Strike risk rising"
    )

    assert calls == ["relevance_agent", "impact_agent", "action_agent"]
    assert finding["recommended_actions"][0]["action"] == "Reroute to Tacoma"
    assert finding["_meta"]["agent_path"] == "relevance->impact->action"
    assert finding["_meta"]["stage_status"] == {
        "relevance": "ok",
        "impact": "ok",
        "action": "ok",
    }
    assert finding["_meta"]["enrichment_source"] == "adk"


def test_orchestration_skips_impact_and_action_when_irrelevant(monkeypatch):
    calls = []

    def fake_run_llm_json(*, agent_name, model_name, instruction, prompt):
        calls.append(agent_name)
        if agent_name == "relevance_agent":
            return {"is_relevant": False, "relevance_score": 0.12, "reason": "finance-only"}, 8
        raise AssertionError("impact/action should be skipped")

    monkeypatch.setattr("services.adk_agent._run_llm_json", fake_run_llm_json)

    finding = orchestrate_enrichment(
        url="https://example.com/finance", title="Market report", snippet="No port ops signal"
    )

    assert calls == ["relevance_agent"]
    assert finding["_meta"]["is_relevant"] is False
    assert finding["_meta"]["stage_status"]["impact"] == "skipped"
    assert finding["_meta"]["stage_status"]["action"] == "skipped"
