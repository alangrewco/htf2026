from datetime import datetime, timezone

from app.ingestion.base import IngestionSource, RawArticleCandidate
from app.ingestion.http_client import get_json


class UsgsQuakesSource(IngestionSource):
    source_name = "usgs_quakes"

    def fetch(self, max_items: int) -> list[RawArticleCandidate]:
        url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson"
        payload = get_json(url, headers={"Accept": "application/json"})
        features = payload.get("features", [])[:max_items]

        candidates = []
        for feature in features:
            props = feature.get("properties", {})
            source_url = (props.get("url") or "").strip()
            if not source_url:
                continue

            place = (props.get("place") or "").strip()
            mag = props.get("mag")
            headline = f"USGS Earthquake M{mag}: {place}".strip()

            epoch_ms = props.get("time")
            try:
                published_at = datetime.fromtimestamp(epoch_ms / 1000.0, tz=timezone.utc).replace(tzinfo=None)
            except Exception:
                published_at = datetime.now(timezone.utc).replace(tzinfo=None)

            body = f"type={props.get('type')} tsunami={props.get('tsunami')} significance={props.get('sig')}"
            candidates.append(
                RawArticleCandidate(
                    source="usgs_quakes",
                    source_url=source_url,
                    headline=headline,
                    body=body,
                    published_at=published_at,
                    external_id=(props.get("ids") or "").strip() or None,
                    region_tags=["US", "CA"],
                )
            )
        return candidates
