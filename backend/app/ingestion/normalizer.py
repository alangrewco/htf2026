from datetime import datetime, timedelta, timezone

from app.ingestion.base import RawArticleCandidate


def enrich_candidate(candidate: RawArticleCandidate) -> dict:
    text = f"{candidate.headline} {candidate.body}".lower()
    relevance_tags = []
    if any(k in text for k in ["sku", "component", "product", "inventory"]):
        relevance_tags.append("sku")
    if any(k in text for k in ["shipment", "freight", "cargo", "container"]):
        relevance_tags.append("shipment")
    if any(k in text for k in ["supplier", "vendor", "factory"]):
        relevance_tags.append("supplier")
    if any(k in text for k in ["weather", "storm", "hurricane", "flood", "blizzard"]):
        relevance_tags.append("weather")
    if any(k in text for k in ["sanction", "war", "conflict", "tariff", "border"]):
        relevance_tags.append("geopolitical")
    if any(k in text for k in ["bankrupt", "insolvency", "interest rate", "inflation"]):
        relevance_tags.append("financial")

    if not relevance_tags and any(k in text for k in ["port", "logistics", "supply chain", "disruption", "strike"]):
        relevance_tags.append("shipment")

    is_relevant = len(relevance_tags) > 0
    horizon = "short_term" if any(k in text for k in ["today", "now", "active", "immediate"]) else "long_term"
    risk_score = min(100, 20 + (len(relevance_tags) * 15))
    risk_level = "high" if risk_score >= 70 else ("medium" if risk_score >= 40 else "low")

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    geo_countries = list(dict.fromkeys(candidate.region_tags or []))
    if not geo_countries:
        geo_countries = ["US"]

    return {
        "is_relevant": is_relevant,
        "relevance_tags": relevance_tags,
        "horizon": horizon,
        "geo": {
            "countries": geo_countries,
            "ports": [],
            "route_ids": [],
            "lat": None,
            "lng": None,
        },
        "impact_window": {
            "start_at": now.isoformat() + "Z",
            "end_at": (now + timedelta(days=7)).isoformat() + "Z",
            "confidence": 0.55,
        },
        "matched_entities": {
            "sku_ids": [],
            "supplier_ids": [],
        },
        "risk_score": risk_score,
        "risk_level": risk_level,
        "explanation": "Heuristic enrichment from headline/body keywords for MVP ingestion.",
    }
