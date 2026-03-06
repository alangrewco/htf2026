from datetime import datetime, timezone
from urllib.parse import quote

from app.ingestion.base import IngestionSource, RawArticleCandidate
from app.ingestion.http_client import get_json

NOAA_VALID_AREAS = {
    "AL", "AK", "AS", "AR", "AZ", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "GU", "HI", "ID", "IL", "IN",
    "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM",
    "NY", "NC", "ND", "OH", "OK", "OR", "PA", "PR", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VI", "VA",
    "WA", "WV", "WI", "WY", "MP", "PW", "FM", "MH", "AM", "AN", "GM", "LC", "LE", "LH", "LM", "LO", "LS",
    "PH", "PK", "PM", "PS", "PZ", "SL",
}

NOAA_DEFAULT_AREAS = ["CA", "WA", "TX", "NY", "FL"]


def sanitize_area_codes(codes: list[str]) -> list[str]:
    cleaned = []
    for raw in codes:
        code = (raw or "").strip().upper()
        if not code:
            continue
        if code in NOAA_VALID_AREAS and code not in cleaned:
            cleaned.append(code)
    return cleaned


class NoaaAlertsSource(IngestionSource):
    source_name = "noaa_alerts"

    def __init__(self, area_codes: list[str]):
        self.area_codes = sanitize_area_codes(area_codes)
        if not self.area_codes:
            self.area_codes = NOAA_DEFAULT_AREAS

    def fetch(self, max_items: int) -> list[RawArticleCandidate]:
        areas = ",".join([quote(code) for code in self.area_codes])
        url = f"https://api.weather.gov/alerts/active?area={areas}"
        payload = get_json(url, headers={"User-Agent": "htf2026-ingestion/1.0", "Accept": "application/geo+json"})
        features = payload.get("features", [])[:max_items]

        candidates = []
        for feature in features:
            props = feature.get("properties", {})
            headline = (props.get("headline") or props.get("event") or "Weather alert").strip()
            source_url = (props.get("@id") or props.get("id") or "").strip()
            if not source_url:
                continue

            published_raw = props.get("sent") or props.get("effective")
            try:
                published_at = datetime.fromisoformat(published_raw.replace("Z", "+00:00")).replace(tzinfo=None)
            except Exception:
                published_at = datetime.now(timezone.utc).replace(tzinfo=None)

            area_desc = (props.get("areaDesc") or "").strip()
            desc = (props.get("description") or "").strip()
            body = f"{area_desc} {desc}".strip() or headline

            candidates.append(
                RawArticleCandidate(
                    source="noaa_alerts",
                    source_url=source_url,
                    headline=headline,
                    body=body,
                    published_at=published_at,
                    external_id=props.get("id"),
                    region_tags=["US"],
                )
            )
        return candidates
