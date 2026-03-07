from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class SkuRecord(Base):
    __tablename__ = "skus"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    sku_code: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    unit_of_measure: Mapped[str] = mapped_column(String(80), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    risk_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    risk_level: Mapped[str] = mapped_column(String(32), nullable=False, default="low")
    category: Mapped[str] = mapped_column(String(120), nullable=False, default="general")
    supplier_ids_json: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )


class SupplierRecord(Base):
    __tablename__ = "suppliers"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    supplier_code: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    country: Mapped[str] = mapped_column(String(120), nullable=False)
    contact_email: Mapped[str] = mapped_column(String(320), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    region: Mapped[str] = mapped_column(String(120), nullable=False, default="Unknown")
    risk_rating: Mapped[str] = mapped_column(String(64), nullable=False, default="medium")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )


class ShipmentRecord(Base):
    __tablename__ = "shipments"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    shipment_code: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    origin_port_id: Mapped[str] = mapped_column(String(64), nullable=False)
    destination_port_id: Mapped[str] = mapped_column(String(64), nullable=False)
    route_id: Mapped[str] = mapped_column(String(64), nullable=False)
    supplier_id: Mapped[str] = mapped_column(String(64), nullable=False)
    sku_ids_json: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    carrier: Mapped[str] = mapped_column(String(120), nullable=False, default="Unknown")
    order_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    expected_delivery_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    events_json: Mapped[list[dict]] = mapped_column(JSON, nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )


class PortRecord(Base):
    __tablename__ = "ports"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)


class RouteRecord(Base):
    __tablename__ = "routes"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)


class CompanyProfileRecord(Base):
    __tablename__ = "company_profile"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    autonomy_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False)
    max_auto_risk_level: Mapped[str] = mapped_column(String(32), nullable=False)
    disallowed_categories_json: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )


class RiskProfileRecord(Base):
    __tablename__ = "risk_profile"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    manager_risk_tolerance_score: Mapped[float] = mapped_column(Float, nullable=False)
    last_updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)


class IngestionRunRecord(Base):
    __tablename__ = "ingestion_runs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )
    articles_ingested: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    articles_relevant: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    incidents_created: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    proposals_generated: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)


class ArticleRecord(Base):
    __tablename__ = "articles"
    __table_args__ = (
        UniqueConstraint("source", "source_url", name="uq_articles_source_url"),
    )

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    source: Mapped[str] = mapped_column(String(120), nullable=False)
    source_url: Mapped[str] = mapped_column(Text, nullable=False)
    headline: Mapped[str] = mapped_column(Text, nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False, default="")
    summary: Mapped[str] = mapped_column(Text, nullable=False, default="")
    preview_text: Mapped[str] = mapped_column(Text, nullable=False, default="")
    analysis: Mapped[str] = mapped_column(Text, nullable=False, default="")
    keywords_json: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    tags_json: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    source_name: Mapped[str] = mapped_column(String(120), nullable=False, default="")
    body: Mapped[str] = mapped_column(Text, nullable=False)
    published_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    publish_datetime: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    preview_image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    ingestion_run_id: Mapped[str] = mapped_column(String(64), nullable=False)
    processing_state: Mapped[str] = mapped_column(String(64), nullable=False)
    external_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    content_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    region_tags_json: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    enrichment_failed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    enrichment_failed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    enrichment_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    enrichment_attempt_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )


class ArticleEnrichmentRecord(Base):
    __tablename__ = "article_enrichments"

    article_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    is_relevant: Mapped[bool] = mapped_column(Boolean, nullable=False)
    relevance_tags_json: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    horizon: Mapped[str] = mapped_column(String(32), nullable=False)
    geo_json: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    impact_window_json: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    matched_entities_json: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    risk_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    risk_level: Mapped[str] = mapped_column(String(32), nullable=False, default="low")
    explanation: Mapped[str] = mapped_column(Text, nullable=False, default="")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )


class IncidentRecord(Base):
    __tablename__ = "incidents"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    article_id: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)
    classification: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    reasoning: Mapped[str] = mapped_column(Text, nullable=False, default="")
    overlap_tags_json: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    risk_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    risk_level: Mapped[str] = mapped_column(String(32), nullable=False, default="low", index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )


class IngestionCheckpointRecord(Base):
    __tablename__ = "ingestion_checkpoints"

    source_name: Mapped[str] = mapped_column(String(64), primary_key=True)
    last_cursor: Mapped[str | None] = mapped_column(String(255), nullable=True)
    last_polled_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)


class ArticleEnrichmentJobRecord(Base):
    __tablename__ = "article_enrichment_jobs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    article_id: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    attempt_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    next_retry_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )


class EnrichmentQuotaRecord(Base):
    __tablename__ = "enrichment_quota"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    model_calls_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )
