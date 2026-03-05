from __future__ import annotations

from datetime import datetime

import requests

from models import RiskEvent, db


OPEN_METEO_URL = "https://marine-api.open-meteo.com/v1/marine"


def _hazard_score(wave_height: float, wind_speed: float) -> int:
    score = 0
    if wave_height >= 3.0:
        score += 40
    elif wave_height >= 2.0:
        score += 20

    if wind_speed >= 40.0:
        score += 50
    elif wind_speed >= 25.0:
        score += 30

    return min(score, 100)


def poll_weather(waypoints: list[dict], forecast_days: int = 7) -> int:
    created = 0
    for wp in waypoints:
        params = {
            "latitude": wp["lat"],
            "longitude": wp["lon"],
            "hourly": "wave_height,wind_speed_10m",
            "forecast_days": forecast_days,
        }
        response = requests.get(OPEN_METEO_URL, params=params, timeout=20)
        response.raise_for_status()
        payload = response.json()

        hourly = payload.get("hourly", {})
        wave_series = hourly.get("wave_height") or [0.0]
        wind_series = hourly.get("wind_speed_10m") or [0.0]
        wave = max(float(v or 0.0) for v in wave_series)
        wind = max(float(v or 0.0) for v in wind_series)
        severity = _hazard_score(float(wave), float(wind))
        if severity <= 0:
            continue

        now = datetime.utcnow()
        dedupe_key = f"weather:{wp['code']}:{now.strftime('%Y-%m-%d-%H')}"
        if RiskEvent.query.filter_by(dedupe_key=dedupe_key).first():
            continue

        event = RiskEvent(
            event_type="WEATHER",
            title=f"Marine weather hazard near {wp['code']}",
            summary=f"Wave {wave}m and wind {wind}km/h detected.",
            severity=severity,
            confidence=0.75,
            source="open-meteo",
            source_url="https://open-meteo.com/",
            published_at=now,
            impacted_ports=[wp["code"]],
            impacted_countries=[wp["country"]],
            impacted_keywords=["weather", "marine", "waves", "wind"],
            dedupe_key=dedupe_key,
            metadata_json={"wave_height": wave, "wind_speed": wind},
        )
        db.session.add(event)
        created += 1

    db.session.commit()
    return created
