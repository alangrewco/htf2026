from app.bootstrap import initialize_database
from app.db import session_scope
from app.errors import NotFoundError
from app.repositories.article_repo import ArticleRepository

from openapi_server.models.article import Article
from openapi_server.models.article_list_response import ArticleListResponse
from openapi_server.models.enrichment import Enrichment
from openapi_server.models.geo_info import GeoInfo
from openapi_server.models.impact_window import ImpactWindow
from openapi_server.models.matched_entities import MatchedEntities


class ArticleService:
    _initialized = False

    def _ensure_initialized(self):
        if not self.__class__._initialized:
            initialize_database()
            self.__class__._initialized = True

    def list_articles(self, state: str | None, relevant: bool | None, page: int, page_size: int) -> ArticleListResponse:
        self._ensure_initialized()
        with session_scope() as session:
            repo = ArticleRepository(session)
            rows, total = repo.list_articles(state=state, relevant=relevant, page=page, page_size=page_size)
            return ArticleListResponse(
                items=[self._to_article(r) for r in rows],
                total=total,
                page=page,
                page_size=page_size,
            )

    def get_article(self, article_id: str) -> Article:
        self._ensure_initialized()
        with session_scope() as session:
            repo = ArticleRepository(session)
            row = repo.get_article(article_id)
            if not row:
                raise NotFoundError("Article not found.", {"article_id": article_id})
            return self._to_article(row)

    def get_article_enrichment(self, article_id: str) -> Enrichment:
        self._ensure_initialized()
        with session_scope() as session:
            repo = ArticleRepository(session)
            row = repo.get_article_enrichment(article_id)
            if not row:
                raise NotFoundError("Article enrichment not found.", {"article_id": article_id})

            geo = row.geo_json or {}
            impact = row.impact_window_json or {}
            matched = row.matched_entities_json or {}
            return Enrichment(
                article_id=row.article_id,
                is_relevant=row.is_relevant,
                relevance_tags=row.relevance_tags_json or [],
                horizon=row.horizon,
                geo=GeoInfo(
                    countries=geo.get("countries", []),
                    ports=geo.get("ports", []),
                    route_ids=geo.get("route_ids", []),
                    lat=geo.get("lat"),
                    lng=geo.get("lng"),
                ),
                impact_window=ImpactWindow(
                    start_at=impact.get("start_at"),
                    end_at=impact.get("end_at"),
                    confidence=impact.get("confidence", 0.0),
                ),
                matched_entities=MatchedEntities(
                    sku_ids=matched.get("sku_ids", []),
                    supplier_ids=matched.get("supplier_ids", []),
                ),
                risk_score=row.risk_score,
                risk_level=row.risk_level,
                explanation=row.explanation,
            )

    def _to_article(self, row):
        return Article(
            id=row.id,
            source=row.source,
            source_url=row.source_url,
            headline=row.headline,
            title=row.title or row.headline,
            summary=row.summary or "",
            preview_text=row.preview_text or "",
            analysis=row.analysis or "",
            keywords=row.keywords_json or [],
            tags=row.tags_json or [],
            source_name=row.source_name or row.source,
            body=row.body,
            published_at=row.published_at,
            publish_datetime=row.publish_datetime or row.published_at,
            preview_image_url=row.preview_image_url,
            ingestion_run_id=row.ingestion_run_id,
            processing_state=row.processing_state,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )
