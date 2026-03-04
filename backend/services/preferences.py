from __future__ import annotations

from models import Preference, db


def normalize_weights(w_cost: float, w_speed: float, w_risk: float) -> tuple[float, float, float]:
    total = w_cost + w_speed + w_risk
    if total <= 0:
        return 0.33, 0.33, 0.34
    return w_cost / total, w_speed / total, w_risk / total


def get_or_create_preferences() -> Preference:
    pref = Preference.query.first()
    if pref:
        return pref
    pref = Preference(profile="resilient", w_cost=0.3, w_speed=0.3, w_risk=0.4)
    db.session.add(pref)
    db.session.commit()
    return pref


def update_preferences(data: dict) -> Preference:
    pref = get_or_create_preferences()
    w_cost, w_speed, w_risk = normalize_weights(
        float(data["w_cost"]), float(data["w_speed"]), float(data["w_risk"])
    )
    pref.profile = data["profile"]
    pref.w_cost = w_cost
    pref.w_speed = w_speed
    pref.w_risk = w_risk
    pref.blocked_ports = data.get("blocked_ports", [])
    pref.preferred_carriers = data.get("preferred_carriers", [])
    db.session.commit()
    return pref


def apply_feedback_update(pref: Preference, reason_code: str) -> Preference:
    if reason_code == "too_expensive":
        pref.w_cost += 0.05
    elif reason_code == "too_slow":
        pref.w_speed += 0.05
    elif reason_code == "too_risky":
        pref.w_risk += 0.05

    pref.w_cost, pref.w_speed, pref.w_risk = normalize_weights(
        pref.w_cost, pref.w_speed, pref.w_risk
    )
    db.session.commit()
    return pref
