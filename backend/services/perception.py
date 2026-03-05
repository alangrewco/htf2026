"""
Perception Layer — LLM-Based Disruption Detection
===================================================
Ported from HTF_Hackathonb. Classifies news headlines as port disruptions
and creates Disruption records when detected.

Uses the existing google-adk dependency pattern from adk_agent.py.
Falls back to keyword-based classification if LLM unavailable.
"""

from __future__ import annotations

import json
import os
import uuid
from datetime import datetime

from models import Disruption, Port, db


def classify_news(headline: str, body: str = "") -> dict:
    """
    Classify whether text describes a maritime supply chain disruption.
    Returns structured detection result.
    """
    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    if not api_key:
        return _fallback_classification(headline)

    prompt = f"""You are a maritime supply chain risk analyst.
Analyze the following news and determine if it describes a maritime supply chain disruption.

HEADLINE: {headline}
BODY: {body}

Respond with ONLY a JSON object (no markdown, no explanation):
{{
    "is_disruption": true/false,
    "port_name": "name of affected port or null",
    "port_code": "2-3 letter code like USLAX, CNSHA, or null",
    "disruption_type": "labor_strike|weather|congestion|equipment_failure|security|null",
    "severity_score": 0.0-1.0,
    "expected_delay_days": integer or null,
    "confidence": 0.0-1.0,
    "summary": "one-line summary of the disruption"
}}"""

    try:
        from google.genai import types
        from google.adk.agents import LlmAgent
        from google.adk.runners import InMemoryRunner

        model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-pro")
        agent = LlmAgent(
            name="perception_classifier",
            model=model_name,
            instruction="Return strict JSON only. Do not include markdown.",
        )
        runner = InMemoryRunner(agent=agent, app_name="harborguard-perception")

        user_id = "single_tenant_company"
        session_id = str(uuid.uuid4())
        runner.session_service.create_session(
            app_name="harborguard-perception",
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
            cleaned = last_text.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("\n", 1)[1].rsplit("```", 1)[0].strip()
            result = json.loads(cleaned)
            return _validate_result(result)

    except Exception:
        pass

    return _fallback_classification(headline)


def detect_and_create(headline: str, body: str = ""):
    """
    Classify news and, if a disruption is detected, create a Disruption record.
    Returns the created Disruption or None.
    """
    classification = classify_news(headline, body)

    if not classification.get("is_disruption"):
        return None

    port_code = classification.get("port_code")
    if port_code:
        port = Port.query.filter_by(code=port_code).first()
        if not port:
            port = Port.query.first()
    else:
        port = Port.query.first()

    if not port:
        return None

    disruption = Disruption(
        port_code=port.code,
        disruption_type=classification.get("disruption_type", "unknown"),
        severity_score=classification.get("severity_score", 0.5),
        expected_delay_days=classification.get("expected_delay_days", 7),
        confidence_score=classification.get("confidence", 0.5),
        is_active=True,
        detected_at=datetime.utcnow(),
    )
    db.session.add(disruption)
    db.session.commit()
    return disruption


def _validate_result(result: dict) -> dict:
    """Ensure result has required fields with valid types."""
    return {
        "is_disruption": bool(result.get("is_disruption", False)),
        "port_name": result.get("port_name"),
        "port_code": result.get("port_code"),
        "disruption_type": result.get("disruption_type", "unknown"),
        "severity_score": min(1.0, max(0.0, float(result.get("severity_score", 0.5)))),
        "expected_delay_days": int(result.get("expected_delay_days") or 7),
        "confidence": min(1.0, max(0.0, float(result.get("confidence", 0.5)))),
        "summary": result.get("summary", ""),
    }


def _fallback_classification(headline: str) -> dict:
    """Simple keyword-based fallback when LLM is unavailable."""
    headline_lower = headline.lower()
    keywords = {
        "strike": ("labor_strike", 0.8),
        "storm": ("weather", 0.7),
        "hurricane": ("weather", 0.9),
        "typhoon": ("weather", 0.9),
        "congestion": ("congestion", 0.6),
        "closure": ("congestion", 0.7),
        "shutdown": ("labor_strike", 0.85),
    }

    for keyword, (dtype, severity) in keywords.items():
        if keyword in headline_lower:
            return {
                "is_disruption": True,
                "port_name": "Port of Los Angeles",
                "port_code": "USLAX",
                "disruption_type": dtype,
                "severity_score": severity,
                "expected_delay_days": 10,
                "confidence": 0.6,
                "summary": f"Keyword '{keyword}' detected in headline",
            }

    return {
        "is_disruption": False,
        "port_name": None,
        "port_code": None,
        "disruption_type": None,
        "severity_score": 0.0,
        "expected_delay_days": None,
        "confidence": 0.8,
        "summary": "No maritime disruption detected",
    }
