import json
import os
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse
from urllib import request

from app.errors import ValidationError
from app.ingestion.base import RawArticleCandidate
from app.ingestion.normalizer import enrich_candidate

VALID_RELEVANCE_TAGS = {"sku", "shipment", "supplier", "weather", "geopolitical", "financial"}
VALID_HORIZONS = {"short_term", "long_term"}
VALID_RISK_LEVELS = {"low", "medium", "high"}


class GeminiEnrichmentAgent:
    def __init__(self):
        self.provider = os.getenv("ENRICHMENT_PROVIDER", "mock").strip().lower()
        self.model = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-preview-lite")
        self.api_key = os.getenv("GOOGLE_API_KEY", "").strip()

    def enrich_article(self, article_row, context: dict) -> dict:
        if self.provider == "mock":
            candidate = RawArticleCandidate(
                source=article_row.source,
                source_url=article_row.source_url,
                headline=article_row.headline,
                body=article_row.body,
                published_at=article_row.published_at,
                external_id=article_row.external_id,
                region_tags=article_row.region_tags_json or [],
            )
            payload = enrich_candidate(candidate)
            payload["matched_entities"] = self._match_entities(article_row, context)
            payload["geo"]["ports"] = self._match_ports(article_row, context)
            payload["geo"]["route_ids"] = self._match_routes(article_row, context)
            return self._validate(payload, article_row)

        if not self.api_key:
            raise ValidationError("GOOGLE_API_KEY is required for Gemini enrichment provider.")
        payload = self._call_gemini(article_row, context)
        return self._validate(payload, article_row)

    def _call_gemini(self, article_row, context: dict) -> dict:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        prompt = self._build_prompt(article_row, context)
        body = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": prompt}],
                }
            ],
            "generationConfig": {
                "temperature": 0.1,
                "responseMimeType": "application/json",
            },
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
            raise ValidationError("Gemini returned empty enrichment output.")
        return json.loads(text)

    def _build_prompt(self, article_row, context: dict) -> str:
        return (
            "You are an enrichment agent. Return only JSON.\n"
            "Use exactly this schema:\n"
            "{"
            "\"is_relevant\":bool,"
            "\"relevance_tags\":[\"sku|shipment|supplier|weather|geopolitical|financial\"],"
            "\"horizon\":\"short_term|long_term\","
            "\"geo\":{\"countries\":[],\"ports\":[],\"route_ids\":[],\"lat\":null,\"lng\":null},"
            "\"impact_window\":{\"start_at\":\"ISO8601Z\",\"end_at\":\"ISO8601Z\",\"confidence\":0.0},"
            "\"matched_entities\":{\"sku_ids\":[],\"supplier_ids\":[]},"
            "\"risk_score\":0,"
            "\"risk_level\":\"low|medium|high\","
            "\"explanation\":\"...\","
            "\"article_metadata\":{"
            "\"title\":\"string\","
            "\"summary\":\"string\","
            "\"preview_text\":\"string\","
            "\"analysis\":\"string\","
            "\"keywords\":[\"string\"],"
            "\"tags\":[\"string\"],"
            "\"source_name\":\"string\","
            "\"publish_datetime\":\"ISO8601Z\","
            "\"preview_image_url\":null"
            "}"
            "}\n"
            "Article:\n"
            f"headline={article_row.headline}\n"
            f"body={article_row.body}\n"
            f"source={article_row.source}\n"
            f"published_at={article_row.published_at.isoformat()}Z\n"
            "Company context JSON:\n"
            f"{json.dumps(context)[:40000]}"
        )

    def _match_entities(self, article_row, context: dict) -> dict:
        text = f"{article_row.headline} {article_row.body}".lower()
        sku_ids = []
        for sku in context.get("skus", []):
            if sku["name"].lower() in text or sku["sku_code"].lower() in text:
                sku_ids.append(sku["id"])

        supplier_ids = []
        for supplier in context.get("suppliers", []):
            if supplier["name"].lower() in text or supplier["supplier_code"].lower() in text:
                supplier_ids.append(supplier["id"])

        return {"sku_ids": list(dict.fromkeys(sku_ids)), "supplier_ids": list(dict.fromkeys(supplier_ids))}

    def _match_ports(self, article_row, context: dict) -> list[str]:
        text = f"{article_row.headline} {article_row.body}".lower()
        matched = []
        for port in context.get("ports", []):
            if port["name"].lower() in text:
                matched.append(port["id"])
        return list(dict.fromkeys(matched))

    def _match_routes(self, article_row, context: dict) -> list[str]:
        text = f"{article_row.headline} {article_row.body}".lower()
        matched = []
        for route in context.get("routes", []):
            if route["name"].lower() in text:
                matched.append(route["id"])
        return list(dict.fromkeys(matched))

    def _validate(self, data: dict, article_row) -> dict:
        missing = [
            key
            for key in [
                "is_relevant",
                "relevance_tags",
                "horizon",
                "geo",
                "impact_window",
                "matched_entities",
                "risk_score",
                "risk_level",
                "explanation",
            ]
            if key not in data
        ]
        if missing:
            raise ValidationError("Enrichment output missing required fields.", {"missing_fields": missing})

        tags = data.get("relevance_tags") or []
        invalid_tags = [t for t in tags if t not in VALID_RELEVANCE_TAGS]
        if invalid_tags:
            raise ValidationError("Invalid relevance tags in enrichment output.", {"invalid_tags": invalid_tags})

        if data.get("horizon") not in VALID_HORIZONS:
            raise ValidationError("Invalid horizon in enrichment output.", {"horizon": data.get("horizon")})

        score = int(max(0, min(100, int(data.get("risk_score", 0)))))
        data["risk_score"] = score
        if data.get("risk_level") not in VALID_RISK_LEVELS:
            data["risk_level"] = "high" if score >= 70 else ("medium" if score >= 40 else "low")

        geo = data.get("geo") or {}
        geo.setdefault("countries", [])
        geo.setdefault("ports", [])
        geo.setdefault("route_ids", [])
        geo.setdefault("lat", None)
        geo.setdefault("lng", None)
        data["geo"] = geo

        impact = data.get("impact_window") or {}
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        impact.setdefault("start_at", now.isoformat() + "Z")
        impact.setdefault("end_at", (now + timedelta(days=7)).isoformat() + "Z")
        confidence = impact.get("confidence", 0.5)
        impact["confidence"] = max(0.0, min(1.0, float(confidence)))
        data["impact_window"] = impact

        matched = data.get("matched_entities") or {}
        matched.setdefault("sku_ids", [])
        matched.setdefault("supplier_ids", [])
        data["matched_entities"] = matched

        data["relevance_tags"] = list(dict.fromkeys(tags))
        data["is_relevant"] = bool(data.get("is_relevant"))
        data["explanation"] = str(data.get("explanation") or "Generated by enrichment agent.")
        data["article_metadata"] = self._normalize_article_metadata(data.get("article_metadata"), article_row, data)

        return data

    @staticmethod
    def _normalize_article_metadata(raw_metadata, article_row, enrichment: dict) -> dict:
        metadata = raw_metadata if isinstance(raw_metadata, dict) else {}
        body = str(getattr(article_row, "body", "") or "").strip()
        headline = str(getattr(article_row, "headline", "") or "").strip()
        explanation = str(enrichment.get("explanation") or "").strip()

        default_preview = body[:500] if body else headline[:500]
        default_summary = explanation[:300] if explanation else (headline[:300] if headline else "")
        default_analysis = explanation if explanation else "Generated by enrichment agent."

        title = str(metadata.get("title") or headline)
        summary = str(metadata.get("summary") or default_summary)
        preview_text = str(metadata.get("preview_text") or default_preview)
        analysis = str(metadata.get("analysis") or default_analysis)
        source_name = str(metadata.get("source_name") or getattr(article_row, "source", ""))

        keywords_raw = metadata.get("keywords")
        keywords = [str(x).strip() for x in (keywords_raw or []) if str(x).strip()] if isinstance(keywords_raw, list) else []
        tags_raw = metadata.get("tags")
        tags = [str(x).strip() for x in (tags_raw or []) if str(x).strip()] if isinstance(tags_raw, list) else []

        if not keywords:
            keywords = list(dict.fromkeys((enrichment.get("relevance_tags") or [])[:6]))
        if not tags:
            tags = list(dict.fromkeys((enrichment.get("relevance_tags") or [])[:6]))

        publish_dt = metadata.get("publish_datetime")
        if isinstance(publish_dt, datetime):
            publish_datetime = publish_dt
        elif isinstance(publish_dt, str) and publish_dt.strip():
            try:
                publish_datetime = datetime.fromisoformat(publish_dt.strip().replace("Z", "+00:00")).replace(tzinfo=None)
            except ValueError:
                publish_datetime = getattr(article_row, "published_at", datetime.now(timezone.utc).replace(tzinfo=None))
        else:
            publish_datetime = getattr(article_row, "published_at", datetime.now(timezone.utc).replace(tzinfo=None))

        preview_image_url = metadata.get("preview_image_url")
        if isinstance(preview_image_url, str):
            candidate = preview_image_url.strip()
            parsed = urlparse(candidate)
            if parsed.scheme in {"http", "https"} and parsed.netloc:
                preview_image_url = candidate
            else:
                preview_image_url = None
        else:
            preview_image_url = None

        return {
            "title": title,
            "summary": summary,
            "preview_text": preview_text,
            "analysis": analysis,
            "keywords": list(dict.fromkeys(keywords)),
            "tags": list(dict.fromkeys(tags)),
            "source_name": source_name,
            "publish_datetime": publish_datetime,
            "preview_image_url": preview_image_url,
        }
