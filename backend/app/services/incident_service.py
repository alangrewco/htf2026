from datetime import datetime, timezone
from uuid import uuid4

from app.adk.incident_agent import GeminiIncidentAgent
from app.bootstrap import initialize_database
from app.db import session_scope
from app.errors import NotFoundError
from app.models import IncidentRecord
from app.repositories.incident_repo import IncidentRepository
from app.repositories.reference_repo import ReferenceRepository

from openapi_server.models.incident import Incident
from openapi_server.models.incident_list_response import IncidentListResponse


def _utcnow_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class IncidentService:
    _initialized = False

    def __init__(self):
        self._agent = GeminiIncidentAgent()

    def _ensure_initialized(self):
        if not self.__class__._initialized:
            initialize_database()
            self.__class__._initialized = True

    def upsert_incident_for_article(self, article_id: str):
        self._ensure_initialized()
        with session_scope() as session:
            repo = IncidentRepository(session)
            article = repo.get_article(article_id)
            enrichment = repo.get_article_enrichment(article_id)
            if not article or not enrichment or not enrichment.is_relevant:
                return None

            context = self._build_context(session)
            article_payload = {
                "id": article.id,
                "source": article.source,
                "source_url": article.source_url,
                "headline": article.headline,
                "body": article.body,
                "published_at": f"{article.published_at.isoformat()}Z",
            }
            enrichment_payload = {
                "is_relevant": enrichment.is_relevant,
                "relevance_tags": enrichment.relevance_tags_json or [],
                "horizon": enrichment.horizon,
                "geo": enrichment.geo_json or {},
                "impact_window": enrichment.impact_window_json or {},
                "matched_entities": enrichment.matched_entities_json or {},
                "risk_score": enrichment.risk_score,
                "risk_level": enrichment.risk_level,
                "explanation": enrichment.explanation,
            }
            classified = self._agent.classify_incident(article_payload, enrichment_payload, context)

            existing = repo.get_incident_by_article_id(article_id)
            now = _utcnow_naive()
            if existing is None:
                row = IncidentRecord(
                    id=uuid4().hex,
                    article_id=article_id,
                    classification=classified["classification"],
                    status="open",
                    reasoning=classified["reasoning"],
                    overlap_tags_json=classified["overlap_tags"],
                    risk_score=classified["risk_score"],
                    risk_level=classified["risk_level"],
                    created_at=now,
                    updated_at=now,
                )
                repo.create_incident(row)
                if article.ingestion_run_id:
                    run = repo.get_run(article.ingestion_run_id)
                    if run:
                        run.incidents_created = (run.incidents_created or 0) + 1
            else:
                existing.classification = classified["classification"]
                existing.reasoning = classified["reasoning"]
                existing.overlap_tags_json = classified["overlap_tags"]
                existing.risk_score = classified["risk_score"]
                existing.risk_level = classified["risk_level"]
                existing.updated_at = now
                row = existing

            return self._to_incident(row)

    def list_incidents(
        self,
        *,
        status: str | None,
        classification: str | None,
        risk_level: str | None,
        page: int,
        page_size: int,
    ) -> IncidentListResponse:
        self._ensure_initialized()
        with session_scope() as session:
            repo = IncidentRepository(session)
            rows, total = repo.list_incidents(
                status=status,
                classification=classification,
                risk_level=risk_level,
                page=page,
                page_size=page_size,
            )
            return IncidentListResponse(
                items=[self._to_incident(r) for r in rows],
                total=total,
                page=page,
                page_size=page_size,
            )

    def get_incident(self, incident_id: str) -> Incident:
        self._ensure_initialized()
        with session_scope() as session:
            repo = IncidentRepository(session)
            row = repo.get_incident(incident_id)
            if not row:
                raise NotFoundError("Incident not found.", {"incident_id": incident_id})
            return self._to_incident(row)

    def _build_context(self, session) -> dict:
        ref = ReferenceRepository(session)
        return {
            "skus": [{"id": x.id, "sku_code": x.sku_code, "name": x.name} for x in ref.list_skus()],
            "suppliers": [{"id": x.id, "supplier_code": x.supplier_code, "name": x.name} for x in ref.list_suppliers()],
            "shipments": [
                {
                    "id": x.id,
                    "shipment_code": x.shipment_code,
                    "origin_port_id": x.origin_port_id,
                    "destination_port_id": x.destination_port_id,
                    "route_id": x.route_id,
                    "supplier_id": x.supplier_id,
                    "sku_ids": list((x.skus_json or {}).keys()),
                }
                for x in ref.list_shipments()
            ],
            "ports": [{"id": x.id, "name": x.name} for x in ref.list_ports()],
            "routes": [{"id": x.id, "name": x.name} for x in ref.list_routes()],
        }

    def _to_incident(self, row: IncidentRecord) -> Incident:
        return Incident(
            id=row.id,
            article_id=row.article_id,
            classification=row.classification,
            status=row.status,
            reasoning=row.reasoning,
            overlap_tags=row.overlap_tags_json or [],
            risk_score=row.risk_score,
            risk_level=row.risk_level,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )
