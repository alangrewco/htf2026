from datetime import datetime, timezone

from sqlalchemy import asc, or_, select

from app.models import (
    ArticleEnrichmentJobRecord,
    ArticleRecord,
    EnrichmentQuotaRecord,
    IngestionRunRecord,
)


class EnrichmentRepository:
    def __init__(self, session):
        self.session = session

    def get_job_by_article_id(self, article_id: str):
        stmt = select(ArticleEnrichmentJobRecord).where(ArticleEnrichmentJobRecord.article_id == article_id)
        return self.session.execute(stmt).scalar_one_or_none()

    def create_job(self, record: ArticleEnrichmentJobRecord):
        self.session.add(record)
        self.session.flush()
        return record

    def list_ready_jobs(self, now: datetime, limit: int):
        stmt = (
            select(ArticleEnrichmentJobRecord.id)
            .where(
                or_(
                    ArticleEnrichmentJobRecord.status == "queued",
                    (ArticleEnrichmentJobRecord.status == "failed")
                    & (ArticleEnrichmentJobRecord.next_retry_at.is_not(None))
                    & (ArticleEnrichmentJobRecord.next_retry_at <= now),
                )
            )
            .order_by(asc(ArticleEnrichmentJobRecord.created_at))
            .limit(limit)
        )
        return list(self.session.execute(stmt).scalars().all())

    def get_job(self, job_id: str):
        return self.session.get(ArticleEnrichmentJobRecord, job_id)

    def get_article(self, article_id: str):
        return self.session.get(ArticleRecord, article_id)

    def get_run(self, run_id: str):
        return self.session.get(IngestionRunRecord, run_id)

    def get_quota(self):
        return self.session.get(EnrichmentQuotaRecord, "global")

    def get_or_create_quota(self):
        row = self.get_quota()
        if row is None:
            row = EnrichmentQuotaRecord(
                id="global",
                model_calls_count=0,
                updated_at=datetime.now(timezone.utc).replace(tzinfo=None),
            )
            self.session.add(row)
            self.session.flush()
        return row
