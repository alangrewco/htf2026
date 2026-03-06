from sqlalchemy import desc, select

from app.models import IngestionCheckpointRecord, IngestionRunRecord


class IngestionRepository:
    def __init__(self, session):
        self.session = session

    def create_run(self, record: IngestionRunRecord):
        self.session.add(record)
        self.session.flush()
        return record

    def get_run(self, run_id: str):
        return self.session.get(IngestionRunRecord, run_id)

    def get_last_run(self):
        stmt = select(IngestionRunRecord).order_by(desc(IngestionRunRecord.created_at)).limit(1)
        return self.session.execute(stmt).scalar_one_or_none()

    def upsert_checkpoint(self, source_name: str, cursor: str | None, polled_at):
        row = self.session.get(IngestionCheckpointRecord, source_name)
        if row is None:
            row = IngestionCheckpointRecord(source_name=source_name, last_cursor=cursor, last_polled_at=polled_at)
            self.session.add(row)
        else:
            row.last_cursor = cursor
            row.last_polled_at = polled_at
        self.session.flush()
        return row
