import json
import os
from urllib import request

from app.errors import ValidationError

VALID_CLASSIFICATIONS = {"risk_exposure", "active_disruption"}
VALID_OVERLAP_TAGS = {"port_overlap", "route_overlap", "immediate_sku_threat"}
VALID_RISK_LEVELS = {"low", "medium", "high"}


class GeminiIncidentAgent:
    def __init__(self):
        self.provider = os.getenv("INCIDENT_PROVIDER", "gemini").strip().lower()
        self.model = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite-preview")
        self.api_key = os.getenv("GOOGLE_API_KEY", "").strip()

    def classify_incident(self, article: dict, enrichment: dict, context: dict) -> dict:
        if self.provider == "mock":
            return self._validate(self._classify_mock(enrichment))

        if not self.api_key:
            raise ValidationError("GOOGLE_API_KEY is required for incident Gemini provider.")
        data = self._call_gemini(article=article, enrichment=enrichment, context=context)
        return self._validate(data)

    def _classify_mock(self, enrichment: dict) -> dict:
        overlap_tags = []
        geo = enrichment.get("geo") or {}
        matched = enrichment.get("matched_entities") or {}
        if geo.get("ports"):
            overlap_tags.append("port_overlap")
        if geo.get("route_ids"):
            overlap_tags.append("route_overlap")
        if matched.get("sku_ids"):
            overlap_tags.append("immediate_sku_threat")

        classification = "active_disruption" if overlap_tags else "risk_exposure"
        risk_score = int(enrichment.get("risk_score", 0))
        risk_level = str(enrichment.get("risk_level", "low"))

        return {
            "classification": classification,
            "overlap_tags": overlap_tags,
            "reasoning": f"Classified from enrichment signals: {', '.join(overlap_tags) if overlap_tags else 'future risk only'}",
            "risk_score": risk_score,
            "risk_level": risk_level,
        }

    def _call_gemini(self, article: dict, enrichment: dict, context: dict) -> dict:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        prompt = self._build_prompt(article=article, enrichment=enrichment, context=context)
        body = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.1, "responseMimeType": "application/json"},
        }
        req = request.Request(
            url,
            method="POST",
            headers={"Content-Type": "application/json"},
            data=json.dumps(body).encode("utf-8"),
        )
        with request.urlopen(req, timeout=45) as response:
            raw = response.read().decode("utf-8", errors="replace")
        parsed = json.loads(raw)
        text = (
            parsed.get("candidates", [{}])[0]
            .get("content", {})
            .get("parts", [{}])[0]
            .get("text", "")
            .strip()
        )
        if not text:
            raise ValidationError("Gemini returned empty incident classification output.")
        return json.loads(text)

    def _build_prompt(self, article: dict, enrichment: dict, context: dict) -> str:
        return (
            "You are an incident classification agent for shipping disruptions. Return only JSON.\n"
            "Schema:\n"
            "{"
            "\"classification\":\"risk_exposure|active_disruption\","
            "\"overlap_tags\":[\"port_overlap|route_overlap|immediate_sku_threat\"],"
            "\"reasoning\":\"short explanation\","
            "\"risk_score\":0,"
            "\"risk_level\":\"low|medium|high\""
            "}\n"
            "Business rule:\n"
            "- active_disruption if article overlaps company port or route, OR there is immediate sku threat.\n"
            "- otherwise risk_exposure.\n"
            "Example immediate sku threat: LED metal leg production interruption and company uses LED-related SKUs.\n"
            f"Article JSON:\n{json.dumps(article)[:12000]}\n"
            f"Enrichment JSON:\n{json.dumps(enrichment)[:20000]}\n"
            f"Company context JSON:\n{json.dumps(context)[:20000]}\n"
        )

    def _validate(self, data: dict) -> dict:
        missing = [x for x in ["classification", "overlap_tags", "reasoning", "risk_score", "risk_level"] if x not in data]
        if missing:
            raise ValidationError("Incident classification output missing required fields.", {"missing_fields": missing})

        classification = str(data.get("classification"))
        if classification not in VALID_CLASSIFICATIONS:
            raise ValidationError("Invalid incident classification.", {"classification": classification})

        raw_tags = data.get("overlap_tags") or []
        tags = []
        for tag in raw_tags:
            t = str(tag)
            if t in VALID_OVERLAP_TAGS and t not in tags:
                tags.append(t)

        score = int(max(0, min(100, int(data.get("risk_score", 0)))))
        level = str(data.get("risk_level", ""))
        if level not in VALID_RISK_LEVELS:
            level = "high" if score >= 70 else ("medium" if score >= 40 else "low")

        if classification == "active_disruption" and not tags:
            tags = ["immediate_sku_threat"]
        if classification == "risk_exposure":
            tags = []

        return {
            "classification": classification,
            "overlap_tags": tags,
            "reasoning": str(data.get("reasoning") or "Classified by incident agent."),
            "risk_score": score,
            "risk_level": level,
        }

