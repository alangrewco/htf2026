from __future__ import annotations

from datetime import datetime

from models import Recommendation, RiskEvent, Shipment, SKU, db
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


def _compute_sku_risk(sku_id: int) -> float:
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

    for sku_id in sku_ids:
        sku = SKU.query.get(sku_id)
        if not sku:
            continue

        cost = float(sku.unit_cost)
        lead_time = 14.0 + (sku_id % 5)
        risk = _compute_sku_risk(sku_id)

        raw_candidates.append((sku, cost, lead_time, risk))
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

    for sku, cost, lead_time, risk in raw_candidates:
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
        }
        explanation = [
            f"SKU {sku.id} scored using weighted cost/speed/risk model.",
            f"Inputs cost={cost:.2f}, lead_time={lead_time:.1f}, risk={risk:.1f}",
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
