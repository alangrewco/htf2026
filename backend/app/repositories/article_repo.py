from datetime import datetime, timezone

from sqlalchemy import desc, select

from app.models import ArticleEnrichmentRecord, ArticleRecord


class ArticleRepository:
    def __init__(self, session):
        self.session = session

    def get_article(self, article_id: str):
        return self.session.get(ArticleRecord, article_id)

    def get_article_enrichment(self, article_id: str):
        return self.session.get(ArticleEnrichmentRecord, article_id)

    def get_article_by_source_url(self, source: str, source_url: str):
        stmt = select(ArticleRecord).where(ArticleRecord.source == source, ArticleRecord.source_url == source_url)
        return self.session.execute(stmt).scalar_one_or_none()

    def get_article_by_content_hash(self, content_hash: str):
        stmt = select(ArticleRecord).where(ArticleRecord.content_hash == content_hash)
        return self.session.execute(stmt).scalar_one_or_none()

    def create_article(self, record: ArticleRecord):
        self.session.add(record)
        self.session.flush()
        return record

    def upsert_enrichment(self, article_id: str, data: dict):
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        row = self.session.get(ArticleEnrichmentRecord, article_id)
        if row is None:
            row = ArticleEnrichmentRecord(
                article_id=article_id,
                is_relevant=data["is_relevant"],
                relevance_tags_json=data["relevance_tags"],
                horizon=data["horizon"],
                geo_json=data["geo"],
                impact_window_json=data["impact_window"],
                matched_entities_json=data["matched_entities"],
                risk_score=data["risk_score"],
                risk_level=data["risk_level"],
                explanation=data["explanation"],
                updated_at=now,
            )
            self.session.add(row)
        else:
            row.is_relevant = data["is_relevant"]
            row.relevance_tags_json = data["relevance_tags"]
            row.horizon = data["horizon"]
            row.geo_json = data["geo"]
            row.impact_window_json = data["impact_window"]
            row.matched_entities_json = data["matched_entities"]
            row.risk_score = data["risk_score"]
            row.risk_level = data["risk_level"]
            row.explanation = data["explanation"]
            row.updated_at = now
        self.session.flush()
        return row

    def list_articles(self, state: str | None, relevant: bool | None, page: int, page_size: int):
        stmt = select(ArticleRecord).order_by(desc(ArticleRecord.updated_at))
        if state:
            stmt = stmt.where(ArticleRecord.processing_state == state)
        rows = self.session.execute(stmt).scalars().all()

        if relevant is not None:
            filtered = []
            for row in rows:
                enr = self.get_article_enrichment(row.id)
                if enr and enr.is_relevant == relevant:
                    filtered.append(row)
            rows = filtered

        total = len(rows)
        start = (page - 1) * page_size
        end = start + page_size
        return rows[start:end], total
