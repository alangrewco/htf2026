from sqlalchemy import desc, select

from app.models import ArticleEnrichmentRecord, ArticleRecord, IncidentRecord, IngestionRunRecord


class IncidentRepository:
    def __init__(self, session):
        self.session = session

    def get_article(self, article_id: str):
        return self.session.get(ArticleRecord, article_id)

    def get_article_enrichment(self, article_id: str):
        return self.session.get(ArticleEnrichmentRecord, article_id)

    def get_incident(self, incident_id: str):
        return self.session.get(IncidentRecord, incident_id)

    def get_incident_by_article_id(self, article_id: str):
        stmt = select(IncidentRecord).where(IncidentRecord.article_id == article_id)
        return self.session.execute(stmt).scalar_one_or_none()

    def list_incidents(
        self,
        *,
        status: str | None,
        classification: str | None,
        risk_level: str | None,
        page: int,
        page_size: int,
    ):
        stmt = select(IncidentRecord)
        if status:
            stmt = stmt.where(IncidentRecord.status == status)
        if classification:
            stmt = stmt.where(IncidentRecord.classification == classification)
        if risk_level:
            stmt = stmt.where(IncidentRecord.risk_level == risk_level)

        rows = self.session.execute(stmt.order_by(desc(IncidentRecord.updated_at))).scalars().all()
        total = len(rows)
        start = (page - 1) * page_size
        end = start + page_size
        return rows[start:end], total

    def create_incident(self, record: IncidentRecord):
        self.session.add(record)
        self.session.flush()
        return record

    def get_run(self, run_id: str):
        return self.session.get(IngestionRunRecord, run_id)
