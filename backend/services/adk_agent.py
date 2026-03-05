from __future__ import annotations

from datetime import datetime, timedelta
import json
import os
import re
import uuid

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


def enrich_news_event(url: str, title: str, snippet: str) -> dict:
    """Run ADK LlmAgent and return strict JSON. Falls back to deterministic JSON for local demo."""
    fallback_error = None
    model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-pro")
    try:
        # Optional runtime dependency, kept inside function for testability.
        from google.genai import types
        from google.adk.agents import LlmAgent
        from google.adk.runners import InMemoryRunner

        prompt = (
            "Analyze this maritime supply-chain news event and return strict JSON only. "
            "Keys: event_type,title,summary,severity,confidence,impacted,time_window,"
            "recommended_actions,citations. "
            f"URL: {url}\nTitle: {title}\nSnippet: {snippet}"
        )
        agent = LlmAgent(
            name="research_enricher",
            model=model_name,
            instruction="Return strict JSON only. Do not include markdown.",
        )
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

        if last_text:
            response = _extract_json_payload(last_text)
            if isinstance(response, dict):
                response = _validate_output(response)
                response["_meta"] = {
                    "enrichment_source": "adk",
                    "model": model_name,
                }
                return response
    except Exception as exc:
        # Demo-safe fallback when ADK/config is unavailable.
        fallback_error = str(exc)

    fallback = _validate_output(_default_output(url, title, snippet))
    fallback["_meta"] = {
        "enrichment_source": "fallback",
        "model": model_name,
        "error": fallback_error,
    }
    return fallback
