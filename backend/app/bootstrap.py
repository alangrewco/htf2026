from sqlalchemy import inspect, select, text

from app.db import Base, get_engine, session_scope
from datetime import datetime, timezone

from app.models import CompanyProfileRecord, PortRecord, RiskProfileRecord, RouteRecord

DEFAULT_PORTS = [
    {"id": "port_lax", "name": "Los Angeles"},
    {"id": "port_shg", "name": "Shanghai"},
    {"id": "port_sin", "name": "Singapore"},
]

DEFAULT_ROUTES = [
    {"id": "route_pacific_1", "name": "Pacific Route 1"},
    {"id": "route_asia_us_1", "name": "Asia-US Route 1"},
]

DEFAULT_COMPANY_PROFILE = {
    "id": "amce",
    "autonomy_enabled": True,
    "max_auto_risk_level": "low",
    "disallowed_categories_json": [],
}

DEFAULT_RISK_PROFILE = {
    "id": "amce",
    "manager_risk_tolerance_score": 0.5,
}


def initialize_database():
    engine = get_engine()
    Base.metadata.create_all(engine)
    _apply_non_destructive_migrations(engine)
    with session_scope() as session:
        has_ports = session.execute(select(PortRecord.id).limit(1)).first() is not None
        if not has_ports:
            session.add_all([PortRecord(**row) for row in DEFAULT_PORTS])

        has_routes = session.execute(select(RouteRecord.id).limit(1)).first() is not None
        if not has_routes:
            session.add_all([RouteRecord(**row) for row in DEFAULT_ROUTES])

        has_company_profile = session.execute(select(CompanyProfileRecord.id).limit(1)).first() is not None
        if not has_company_profile:
            now = datetime.now(timezone.utc).replace(tzinfo=None)
            session.add(CompanyProfileRecord(**DEFAULT_COMPANY_PROFILE, created_at=now, updated_at=now))

        has_risk_profile = session.execute(select(RiskProfileRecord.id).limit(1)).first() is not None
        if not has_risk_profile:
            now = datetime.now(timezone.utc).replace(tzinfo=None)
            session.add(RiskProfileRecord(**DEFAULT_RISK_PROFILE, last_updated_at=now))


def _apply_non_destructive_migrations(engine):
    """
    Minimal in-place schema upgrades for hackathon MVP.
    - Keeps existing data.
    - Adds missing columns only.
    """
    insp = inspect(engine)
    if not insp.has_table("articles"):
        return

    existing_cols = {col["name"] for col in insp.get_columns("articles")}
    dialect = engine.dialect.name
    statements: list[str] = []

    if "enrichment_failed" not in existing_cols:
        if dialect == "postgresql":
            statements.append("ALTER TABLE articles ADD COLUMN enrichment_failed BOOLEAN NOT NULL DEFAULT FALSE")
        else:
            statements.append("ALTER TABLE articles ADD COLUMN enrichment_failed BOOLEAN NOT NULL DEFAULT 0")

    if "enrichment_failed_at" not in existing_cols:
        if dialect == "postgresql":
            statements.append("ALTER TABLE articles ADD COLUMN enrichment_failed_at TIMESTAMP")
        else:
            statements.append("ALTER TABLE articles ADD COLUMN enrichment_failed_at DATETIME")

    if "enrichment_error" not in existing_cols:
        if dialect == "postgresql":
            statements.append("ALTER TABLE articles ADD COLUMN enrichment_error TEXT")
        else:
            statements.append("ALTER TABLE articles ADD COLUMN enrichment_error TEXT")

    if "enrichment_attempt_count" not in existing_cols:
        if dialect == "postgresql":
            statements.append("ALTER TABLE articles ADD COLUMN enrichment_attempt_count INTEGER NOT NULL DEFAULT 0")
        else:
            statements.append("ALTER TABLE articles ADD COLUMN enrichment_attempt_count INTEGER NOT NULL DEFAULT 0")

    if not statements:
        return

    with engine.begin() as conn:
        for sql in statements:
            conn.execute(text(sql))
