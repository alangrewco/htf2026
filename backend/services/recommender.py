from __future__ import annotations

from datetime import datetime, timedelta
import os

from models import Recommendation, ResearchFinding, RiskEvent, Shipment, SKU, db
from services.preferences import get_or_create_preferences


PROFILE_WEIGHTS = {
    "resilient": (0.2, 0.2, 0.6),
    "fast": (0.2, 0.6, 0.2),
    "low_cost": (0.6, 0.2, 0.2),
}


def _norm(value: float, min_value: float, max_value: float) -> float:
    if max_value <= min_value:
        return 0.0
    return (value - min_value) / (max_value - min_value)


def _compute_sku_event_risk(sku_id: int) -> float:
    shipments = Shipment.query.filter_by(sku_id=sku_id).all()
    if not shipments:
        return 20.0
    impacted_ports = set()
    for shipment in shipments:
        impacted_ports.add(shipment.origin_port)
        impacted_ports.add(shipment.dest_port)

    relevant = RiskEvent.query.filter(RiskEvent.severity >= 1).all()
    matched = [
        event.severity
        for event in relevant
        if impacted_ports.intersection(set(event.impacted_ports or []))
    ]
    if not matched:
        return 15.0
    return float(sum(matched) / len(matched))


def _as_float(value, default: float) -> float:
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        text = value.strip().lower().replace("%", "")
        mapping = {
            "none": 0.0,
            "negligible": 0.1,
            "very low": 0.2,
            "low": 0.3,
            "moderate": 0.5,
            "medium": 0.5,
            "elevated": 0.65,
            "high": 0.8,
            "severe": 0.9,
            "critical": 0.95,
        }
        if text in mapping:
            return mapping[text]
        try:
            return float(text)
        except ValueError:
            return default
    return default


def _normalize_severity_to_100(value, default: float) -> float:
    parsed = _as_float(value, default)
    if parsed <= 1.0:
        parsed = parsed * 100.0
    return max(0.0, min(100.0, parsed))


def _normalize_confidence_to_1(value, default: float) -> float:
    parsed = _as_float(value, default)
    if parsed > 1.0:
        parsed = parsed / 100.0
    return max(0.0, min(1.0, parsed))


def _finding_impacted_dict(finding_json: dict, event: RiskEvent) -> dict:
    impacted = finding_json.get("impacted")
    if not isinstance(impacted, dict):
        impacted = {}
    ports = impacted.get("ports", []) if isinstance(impacted.get("ports", []), list) else []
    countries = (
        impacted.get("countries", [])
        if isinstance(impacted.get("countries", []), list)
        else []
    )
    keywords = (
        impacted.get("keywords", [])
        if isinstance(impacted.get("keywords", []), list)
        else []
    )

    # Fallback to event-level impacted fields when finding payload is sparse.
    if not ports:
        ports = event.impacted_ports or []
    if not countries:
        countries = event.impacted_countries or []
    if not keywords:
        keywords = event.impacted_keywords or []
    return {"ports": ports, "countries": countries, "keywords": keywords}


def _shipment_matches_finding(shipment: Shipment, impacted: dict) -> bool:
    ports = set(impacted.get("ports", []))
    countries = set(impacted.get("countries", []))
    if shipment.origin_port in ports or shipment.dest_port in ports:
        return True
    return any(
        shipment.origin_port.startswith(country) or shipment.dest_port.startswith(country)
        for country in countries
    )


def _compute_sku_finding_risk_and_actions(
    sku_id: int, *, window_days: int, top_actions: int
) -> tuple[float, list[str], int, list[dict]]:
    shipments = Shipment.query.filter_by(sku_id=sku_id).all()
    if not shipments:
        return 15.0, [], 0, []

    cutoff = datetime.utcnow() - timedelta(days=window_days)
    finding_rows = (
        ResearchFinding.query.join(RiskEvent, ResearchFinding.event_id == RiskEvent.id)
        .filter(ResearchFinding.created_at >= cutoff)
        .order_by(ResearchFinding.created_at.desc())
        .all()
    )
    if not finding_rows:
        return 15.0, [], 0, []

    weighted_values = []
    action_ranked = []
    evidence_rows = []

    for row in finding_rows:
        finding_json = row.finding_json if isinstance(row.finding_json, dict) else {}
        event = RiskEvent.query.get(row.event_id)
        if not event:
            continue
        impacted = _finding_impacted_dict(finding_json, event)
        if not any(_shipment_matches_finding(shipment, impacted) for shipment in shipments):
            continue

        severity = _normalize_severity_to_100(finding_json.get("severity"), event.severity)
        confidence = _normalize_confidence_to_1(
            finding_json.get("confidence"), float(event.confidence or 0.5)
        )
        age_days = max(0.0, (datetime.utcnow() - row.created_at).total_seconds() / 86400.0)
        recency = max(0.1, 1.0 - (age_days / max(window_days, 1)))
        weight = max(0.01, confidence * recency)
        weighted_values.append((severity, weight))
        evidence_rows.append(
            {
                "finding_id": row.id,
                "event_id": event.id,
                "title": event.title,
                "severity": severity,
                "confidence": confidence,
                "recency_weight": recency,
            }
        )

        actions = finding_json.get("recommended_actions", [])
        if isinstance(actions, list):
            for action in actions:
                if not isinstance(action, dict):
                    continue
                text = str(action.get("action", "")).strip()
                if not text:
                    continue
                action_ranked.append((weight, text))

    if not weighted_values:
        return 15.0, [], 0, []

    weighted_sum = sum(sev * w for sev, w in weighted_values)
    weight_total = sum(w for _, w in weighted_values)
    risk = weighted_sum / max(weight_total, 1e-6)

    action_ranked.sort(key=lambda item: item[0], reverse=True)
    top_action_texts = []
    for _, action_text in action_ranked:
        if action_text not in top_action_texts:
            top_action_texts.append(action_text)
        if len(top_action_texts) >= top_actions:
            break

    evidence_rows.sort(key=lambda row: row["severity"] * row["confidence"], reverse=True)
    return risk, top_action_texts, len(evidence_rows), evidence_rows[:3]


def generate_recommendations(profile: str, sku_ids: list[int], horizon_days: int) -> dict:
    pref = get_or_create_preferences()
    if profile in PROFILE_WEIGHTS:
        pref_tuple = PROFILE_WEIGHTS[profile]
        w_cost, w_speed, w_risk = pref_tuple
    else:
        w_cost, w_speed, w_risk = pref.w_cost, pref.w_speed, pref.w_risk

    # Blend explicit profile with learned preferences to let behavior evolve over time.
    w_cost = (w_cost + pref.w_cost) / 2.0
    w_speed = (w_speed + pref.w_speed) / 2.0
    w_risk = (w_risk + pref.w_risk) / 2.0
    total = w_cost + w_speed + w_risk
    w_cost, w_speed, w_risk = w_cost / total, w_speed / total, w_risk / total

    recs = []
    explanations = []
    cost_candidates = []
    speed_candidates = []
    risk_candidates = []
    raw_candidates = []

    findings_window_days = max(1, int(os.getenv("RESEARCH_FINDINGS_WINDOW_DAYS", "14")))
    risk_blend_alpha = float(os.getenv("RISK_BLEND_ALPHA", "0.4"))
    risk_blend_alpha = max(0.0, min(1.0, risk_blend_alpha))
    top_actions_limit = max(1, int(os.getenv("TOP_ACTIONS_PER_RECOMMENDATION", "3")))

    for sku_id in sku_ids:
        sku = SKU.query.get(sku_id)
        if not sku:
            continue

        cost = float(sku.unit_cost)
        lead_time = 14.0 + (sku_id % 5)
        event_risk = _compute_sku_event_risk(sku_id)
        finding_risk, top_actions, findings_count, top_findings = _compute_sku_finding_risk_and_actions(
            sku_id,
            window_days=findings_window_days,
            top_actions=top_actions_limit,
        )
        risk = (risk_blend_alpha * event_risk) + ((1.0 - risk_blend_alpha) * finding_risk)

        raw_candidates.append(
            (sku, cost, lead_time, risk, event_risk, finding_risk, top_actions, findings_count, top_findings)
        )
        cost_candidates.append(cost)
        speed_candidates.append(lead_time)
        risk_candidates.append(risk)

    if not raw_candidates:
        return {
            "recommendations": [],
            "explanation": ["No valid SKUs found."],
            "weights": {"w_cost": w_cost, "w_speed": w_speed, "w_risk": w_risk},
        }

    min_cost, max_cost = min(cost_candidates), max(cost_candidates)
    min_speed, max_speed = min(speed_candidates), max(speed_candidates)
    min_risk, max_risk = min(risk_candidates), max(risk_candidates)

    for sku, cost, lead_time, risk, event_risk, finding_risk, top_actions, findings_count, top_findings in raw_candidates:
        n_cost = _norm(cost, min_cost, max_cost)
        n_speed = _norm(lead_time, min_speed, max_speed)
        n_risk = _norm(risk, min_risk, max_risk)
        score = w_cost * n_cost + w_speed * n_speed + w_risk * n_risk

        rec_payload = {
            "sku_name": sku.name,
            "planned_etd": datetime.utcnow().isoformat(),
            "strategy": profile,
            "estimated_cost": cost,
            "estimated_lead_time_days": lead_time,
            "estimated_risk": risk,
            "estimated_event_risk": event_risk,
            "estimated_finding_risk": finding_risk,
            "evidence_summary": {
                "findings_count": findings_count,
                "top_findings": top_findings,
                "top_actions": top_actions,
            },
        }
        explanation = [
            f"SKU {sku.id} scored using weighted cost/speed/risk model.",
            f"Inputs cost={cost:.2f}, lead_time={lead_time:.1f}, risk={risk:.1f}",
            f"Risk blend event={event_risk:.1f}, findings={finding_risk:.1f}, alpha={risk_blend_alpha:.2f}",
        ]

        rec = Recommendation(
            profile=profile,
            sku_id=sku.id,
            horizon_days=horizon_days,
            score=score,
            recommendation_json=rec_payload,
            explanation_json=explanation,
            weights_json={"w_cost": w_cost, "w_speed": w_speed, "w_risk": w_risk},
        )
        db.session.add(rec)
        db.session.flush()
        recs.append(
            {
                "id": rec.id,
                "profile": profile,
                "sku_id": sku.id,
                "horizon_days": horizon_days,
                "score": score,
                "recommendation": rec_payload,
                "explanation": explanation,
            }
        )

    db.session.commit()
    explanations.append("Recommendations generated using live event risk and learned preferences.")
    return {
        "recommendations": sorted(recs, key=lambda x: x["score"]),
        "explanation": explanations,
        "weights": {"w_cost": w_cost, "w_speed": w_speed, "w_risk": w_risk},
    }
