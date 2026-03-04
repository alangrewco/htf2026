from __future__ import annotations

from datetime import datetime, timedelta
import json
import os
import re
import uuid
import time as time_mod

REQUIRED_KEYS = {
    "event_type",
    "title",
    "summary",
    "severity",
    "confidence",
    "impacted",
    "time_window",
    "recommended_actions",
    "citations",
}


def _env_flag(name: str, default: str = "0") -> bool:
    value = (os.getenv(name, default) or "").strip().lower()
    return value in {"1", "true", "yes", "on"}


def _candidate_models() -> list[str]:
    configured = (os.getenv("GEMINI_MODEL") or "").strip()
    candidates = []
    if configured:
        candidates.append(configured)
    # Fallback models for compatibility across API versions/tenants.
    candidates.extend(["gemini-2.5-flash-lite", "gemini-2.5-pro", "gemini-2.0-flash"])

    unique = []
    for model in candidates:
        if model and model not in unique:
            unique.append(model)
    return unique


def _is_model_not_found(exc: Exception) -> bool:
    text = str(exc).lower()
    return "not_found" in text or "is not found" in text or "model" in text and "not found" in text


def _extract_json_payload(text: str) -> dict:
    """Extract first JSON object from model text (supports fenced JSON)."""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```[a-zA-Z]*\n?", "", cleaned).strip()
        cleaned = re.sub(r"\n?```$", "", cleaned).strip()

    # Fast path: full payload is valid JSON.
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Fallback: find first JSON object in mixed text.
    match = re.search(r"\{.*\}", cleaned, flags=re.DOTALL)
    if not match:
        raise ValueError("No JSON object found in model output")
    return json.loads(match.group(0))


def _run_llm_json(*, agent_name: str, model_name: str, instruction: str, prompt: str) -> tuple[dict, int]:
    from google.genai import types
    from google.adk.agents import LlmAgent
    from google.adk.runners import InMemoryRunner

    started = time_mod.monotonic()
    agent = LlmAgent(name=agent_name, model=model_name, instruction=instruction)
    runner = InMemoryRunner(agent=agent, app_name="maritime-research")

    user_id = "single_tenant_company"
    session_id = str(uuid.uuid4())
    runner.session_service.create_session(
        app_name="maritime-research",
        user_id=user_id,
        session_id=session_id,
    )

    content = types.Content(role="user", parts=[types.Part(text=prompt)])
    last_text = None
    for event in runner.run(user_id=user_id, session_id=session_id, new_message=content):
        event_content = getattr(event, "content", None)
        if not event_content or not getattr(event_content, "parts", None):
            continue
        parts_text = [
            getattr(part, "text", None)
            for part in event_content.parts
            if getattr(part, "text", None)
        ]
        if parts_text:
            last_text = "\n".join(parts_text)

    if not last_text:
        raise ValueError("LLM produced no text response")
    payload = _extract_json_payload(last_text)
    if not isinstance(payload, dict):
        raise ValueError("LLM response was not a JSON object")
    latency_ms = int((time_mod.monotonic() - started) * 1000)
    return payload, latency_ms


def _run_llm_json_with_model_fallback(
    *, agent_name: str, instruction: str, prompt: str, preferred_model: str | None = None
) -> tuple[dict, int, str]:
    models = _candidate_models()
    if preferred_model and preferred_model in models:
        models.remove(preferred_model)
        models.insert(0, preferred_model)

    last_error = None
    for model_name in models:
        try:
            payload, latency_ms = _run_llm_json(
                agent_name=agent_name,
                model_name=model_name,
                instruction=instruction,
                prompt=prompt,
            )
            return payload, latency_ms, model_name
        except Exception as exc:
            last_error = exc
            if _is_model_not_found(exc):
                continue
            raise

    if last_error:
        raise last_error
    raise RuntimeError("No candidate models available")


def _default_output(url: str, title: str, snippet: str) -> dict:
    now = datetime.utcnow()
    return {
        "event_type": "NEWS",
        "title": title,
        "summary": snippet or "Enriched summary not available.",
        "severity": 55,
        "confidence": 0.6,
        "impacted": {
            "ports": ["USLAX"],
            "countries": ["US"],
            "keywords": ["shipping", "port", "disruption"],
        },
        "time_window": {
            "start": now.isoformat(),
            "end": (now + timedelta(days=7)).isoformat(),
        },
        "recommended_actions": [
            {
                "action": "Increase safety stock for critical SKU lanes.",
                "rationale": "Potential disruption around impacted ports.",
            }
        ],
        "citations": [{"url": url, "note": "Original source"}],
    }


def _validate_output(payload: dict) -> dict:
    missing = REQUIRED_KEYS.difference(payload.keys())
    if missing:
        raise ValueError(f"ADK payload missing keys: {sorted(missing)}")
    return payload


def _default_relevance() -> dict:
    return {
        "is_relevant": True,
        "relevance_score": 0.6,
        "reason": "Defaulted to relevant in fallback mode.",
    }


def _validate_relevance(payload: dict) -> dict:
    if not isinstance(payload, dict):
        raise ValueError("relevance payload is not a dict")
    return {
        "is_relevant": bool(payload.get("is_relevant", True)),
        "relevance_score": float(payload.get("relevance_score", 0.5)),
        "reason": str(payload.get("reason", "No reason provided")),
    }


def _validate_impact(payload: dict, title: str, snippet: str) -> dict:
    if not isinstance(payload, dict):
        raise ValueError("impact payload is not a dict")
    candidate = {
        "event_type": payload.get("event_type", "NEWS"),
        "title": payload.get("title", title),
        "summary": payload.get("summary", snippet or "No summary available."),
        "severity": payload.get("severity", 55),
        "confidence": payload.get("confidence", 0.6),
        "impacted": payload.get(
            "impacted", {"ports": [], "countries": [], "keywords": ["shipping"]}
        ),
        "time_window": payload.get("time_window", {"start": None, "end": None}),
        "recommended_actions": payload.get("recommended_actions", []),
        "citations": payload.get("citations", []),
    }
    return _validate_output(candidate)


def _validate_actions(payload: dict) -> list[dict]:
    if not isinstance(payload, dict):
        return []
    actions = payload.get("recommended_actions", [])
    if not isinstance(actions, list):
        return []
    normalized = []
    for action in actions:
        if not isinstance(action, dict):
            continue
        normalized.append(
            {
                "action": str(action.get("action", "")).strip(),
                "rationale": str(action.get("rationale", "")).strip(),
            }
        )
    return [row for row in normalized if row["action"]]


def orchestrate_enrichment(url: str, title: str, snippet: str) -> dict:
    """Run multi-agent enrichment pipeline: relevance -> impact -> action."""
    configured_model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite")
    model_name = configured_model
    fallback_error = None
    stage_status = {"relevance": "skipped", "impact": "skipped", "action": "skipped"}
    latency_ms_by_agent = {"relevance": 0, "impact": 0, "action": 0}
    stage_outputs = {"relevance_raw": None, "impact_raw": None, "action_raw": None}
    include_stage_outputs = _env_flag("ENRICHMENT_INCLUDE_STAGE_OUTPUTS", "1")
    relevance = _default_relevance()
    impact = _default_output(url, title, snippet)
    actions = impact["recommended_actions"]

    try:
        relevance_prompt = (
            "You are RelevanceAgent for a maritime supply chain risk platform. "
            "Return strict JSON only with keys: is_relevant (bool), relevance_score (0-1), reason (string). "
            "Decide whether this article is relevant for Asia<->USA maritime logistics risk monitoring. "
            f"URL: {url}\nTitle: {title}\nSnippet: {snippet}"
        )
        relevance_raw, relevance_ms, resolved_model = _run_llm_json_with_model_fallback(
            agent_name="relevance_agent",
            instruction="Return strict JSON only.",
            prompt=relevance_prompt,
            preferred_model=configured_model,
        )
        stage_outputs["relevance_raw"] = relevance_raw
        model_name = resolved_model
        relevance = _validate_relevance(relevance_raw)
        stage_status["relevance"] = "ok"
        latency_ms_by_agent["relevance"] = relevance_ms

        if relevance["is_relevant"]:
            impact_prompt = (
                "You are ImpactAgent for maritime supply chain risk. Return strict JSON only with keys: "
                "event_type,title,summary,severity,confidence,impacted,time_window,citations. "
                "Where impacted has ports/countries/keywords arrays and time_window has start/end ISO timestamps. "
                "Company lane context: Asia to USA maritime shipments via major ports. "
                f"URL: {url}\nTitle: {title}\nSnippet: {snippet}"
            )
            impact_raw, impact_ms, resolved_model = _run_llm_json_with_model_fallback(
                agent_name="impact_agent",
                instruction="Return strict JSON only.",
                prompt=impact_prompt,
                preferred_model=model_name,
            )
            stage_outputs["impact_raw"] = impact_raw
            model_name = resolved_model
            impact = _validate_impact(impact_raw, title=title, snippet=snippet)
            stage_status["impact"] = "ok"
            latency_ms_by_agent["impact"] = impact_ms

            action_prompt = (
                "You are ActionAgent for a single-tenant maritime supply chain company. "
                "Return strict JSON only with key recommended_actions as an array of objects "
                "with keys action and rationale. Recommend concrete mitigation actions based on this impact JSON: "
                f"{json.dumps(impact, ensure_ascii=False)}"
            )
            action_raw, action_ms, resolved_model = _run_llm_json_with_model_fallback(
                agent_name="action_agent",
                instruction="Return strict JSON only.",
                prompt=action_prompt,
                preferred_model=model_name,
            )
            stage_outputs["action_raw"] = action_raw
            model_name = resolved_model
            actions = _validate_actions(action_raw)
            stage_status["action"] = "ok"
            latency_ms_by_agent["action"] = action_ms
        else:
            stage_status["impact"] = "skipped"
            stage_status["action"] = "skipped"
            impact = {
                "event_type": "NEWS",
                "title": title,
                "summary": (
                    "Article classified as not directly relevant to maritime supply-chain risk."
                ),
                "severity": 10,
                "confidence": relevance["relevance_score"],
                "impacted": {"ports": [], "countries": [], "keywords": []},
                "time_window": {"start": None, "end": None},
                "recommended_actions": [],
                "citations": [{"url": url, "note": "Original source"}],
            }
            actions = []

        merged = {
            "event_type": impact["event_type"],
            "title": impact["title"],
            "summary": impact["summary"],
            "severity": impact["severity"],
            "confidence": impact["confidence"],
            "impacted": impact["impacted"],
            "time_window": impact["time_window"],
            "recommended_actions": actions,
            "citations": impact.get("citations", [{"url": url, "note": "Original source"}]),
            "_meta": {
                "pipeline_version": "1.0",
                "agent_path": "relevance->impact->action",
                "stage_status": stage_status,
                "is_relevant": relevance["is_relevant"],
                "relevance_score": relevance["relevance_score"],
                "relevance_reason": relevance["reason"],
                "latency_ms_by_agent": latency_ms_by_agent,
                "latency_ms_total": sum(latency_ms_by_agent.values()),
                "enrichment_source": "adk",
                "model": model_name,
            },
        }
        if include_stage_outputs:
            merged["_meta"]["stage_outputs"] = stage_outputs
        return _validate_output(merged)
    except Exception as exc:
        fallback_error = str(exc)

    fallback = _validate_output(_default_output(url, title, snippet))
    fallback["_meta"] = {
        "pipeline_version": "1.0",
        "agent_path": "relevance->impact->action",
        "stage_status": stage_status,
        "is_relevant": relevance.get("is_relevant", True),
        "relevance_score": relevance.get("relevance_score", 0.5),
        "relevance_reason": relevance.get("reason", ""),
        "latency_ms_by_agent": latency_ms_by_agent,
        "latency_ms_total": sum(latency_ms_by_agent.values()),
        "enrichment_source": "fallback",
        "model": model_name,
        "error": fallback_error,
    }
    if include_stage_outputs:
        fallback["_meta"]["stage_outputs"] = stage_outputs
    return fallback


def enrich_news_event(url: str, title: str, snippet: str) -> dict:
    """Backwards-compatible entrypoint that now delegates to multi-agent orchestration."""
    return orchestrate_enrichment(url=url, title=title, snippet=snippet)
