from __future__ import annotations

from datetime import datetime

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import UniqueConstraint


db = SQLAlchemy()


class TimestampMixin:
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )


class RiskEvent(db.Model, TimestampMixin):
    __tablename__ = "risk_events"

    id = db.Column(db.Integer, primary_key=True)
    event_type = db.Column(db.String(32), nullable=False)  # WEATHER | NEWS
    title = db.Column(db.String(255), nullable=False)
    summary = db.Column(db.Text, nullable=False)
    severity = db.Column(db.Integer, nullable=False)
    confidence = db.Column(db.Float, nullable=True)
    source = db.Column(db.String(64), nullable=False)
    source_url = db.Column(db.String(1024), nullable=True)
    published_at = db.Column(db.DateTime, nullable=True)
    impacted_ports = db.Column(db.JSON, nullable=False, default=list)
    impacted_countries = db.Column(db.JSON, nullable=False, default=list)
    impacted_keywords = db.Column(db.JSON, nullable=False, default=list)
    time_window_start = db.Column(db.DateTime, nullable=True)
    time_window_end = db.Column(db.DateTime, nullable=True)
    dedupe_key = db.Column(db.String(255), nullable=False, unique=True, index=True)
    metadata_json = db.Column(db.JSON, nullable=False, default=dict)


class ResearchTask(db.Model, TimestampMixin):
    __tablename__ = "research_tasks"

    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey("risk_events.id"), nullable=False)
    mode = db.Column(db.String(32), nullable=False, default="enrich")
    status = db.Column(db.String(32), nullable=False, default="queued")
    error = db.Column(db.Text, nullable=True)


class ResearchFinding(db.Model, TimestampMixin):
    __tablename__ = "research_findings"

    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey("research_tasks.id"), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey("risk_events.id"), nullable=False)
    finding_json = db.Column(db.JSON, nullable=False)


class Preference(db.Model, TimestampMixin):
    __tablename__ = "preferences"

    id = db.Column(db.Integer, primary_key=True)
    profile = db.Column(db.String(32), nullable=False, default="resilient")
    w_cost = db.Column(db.Float, nullable=False, default=0.33)
    w_speed = db.Column(db.Float, nullable=False, default=0.33)
    w_risk = db.Column(db.Float, nullable=False, default=0.34)
    blocked_ports = db.Column(db.JSON, nullable=False, default=list)
    preferred_carriers = db.Column(db.JSON, nullable=False, default=list)


class Recommendation(db.Model, TimestampMixin):
    __tablename__ = "recommendations"

    id = db.Column(db.Integer, primary_key=True)
    profile = db.Column(db.String(32), nullable=False)
    sku_id = db.Column(db.Integer, db.ForeignKey("skus.id"), nullable=False)
    horizon_days = db.Column(db.Integer, nullable=False)
    score = db.Column(db.Float, nullable=False)
    recommendation_json = db.Column(db.JSON, nullable=False)
    explanation_json = db.Column(db.JSON, nullable=False, default=list)
    weights_json = db.Column(db.JSON, nullable=False)


class RecommendationFeedback(db.Model, TimestampMixin):
    __tablename__ = "recommendation_feedback"

    id = db.Column(db.Integer, primary_key=True)
    recommendation_id = db.Column(
        db.Integer, db.ForeignKey("recommendations.id"), nullable=False
    )
    accepted = db.Column(db.Boolean, nullable=False)
    reason_code = db.Column(db.String(64), nullable=False)


class SKU(db.Model):
    __tablename__ = "skus"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    unit_cost = db.Column(db.Float, nullable=False)
    revenue_impact_per_day_stockout = db.Column(db.Float, nullable=False)


class Inventory(db.Model):
    __tablename__ = "inventory"

    id = db.Column(db.Integer, primary_key=True)
    sku_id = db.Column(db.Integer, db.ForeignKey("skus.id"), nullable=False, unique=True)
    on_hand = db.Column(db.Integer, nullable=False)
    reorder_point = db.Column(db.Integer, nullable=False)


class Port(db.Model):
    __tablename__ = "ports"

    code = db.Column(db.String(16), primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    country = db.Column(db.String(2), nullable=False)
    lat = db.Column(db.Float, nullable=False)
    lon = db.Column(db.Float, nullable=False)


class Carrier(db.Model):
    __tablename__ = "carriers"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)


class Route(db.Model):
    __tablename__ = "routes"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    waypoints_json = db.Column(db.JSON, nullable=False, default=list)


class Supplier(db.Model):
    __tablename__ = "suppliers"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    country = db.Column(db.String(2), nullable=False)


class Shipment(db.Model):
    __tablename__ = "shipments"

    id = db.Column(db.Integer, primary_key=True)
    sku_id = db.Column(db.Integer, db.ForeignKey("skus.id"), nullable=False)
    origin_port = db.Column(db.String(16), db.ForeignKey("ports.code"), nullable=False)
    dest_port = db.Column(db.String(16), db.ForeignKey("ports.code"), nullable=False)
    etd = db.Column(db.DateTime, nullable=False)
    eta = db.Column(db.DateTime, nullable=False)
    carrier_id = db.Column(db.Integer, db.ForeignKey("carriers.id"), nullable=False)
    status = db.Column(db.String(32), nullable=False)
    route_id = db.Column(db.Integer, db.ForeignKey("routes.id"), nullable=True)

    __table_args__ = (
        UniqueConstraint("id", name="uq_shipments_id"),
    )


# ---------------------------------------------------------------------------
# Models ported from HTF_Hackathonb (FastAPI) → adapted for Flask-SQLAlchemy
# ---------------------------------------------------------------------------

class Company(db.Model, TimestampMixin):
    """Single-tenant company profile with Risk DNA parameters."""
    __tablename__ = "companies"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    revenue_annual_millions = db.Column(db.Float, nullable=False)
    gross_margin_percent = db.Column(db.Float, nullable=False)
    risk_tolerance = db.Column(db.Float, nullable=False)          # 0.0-1.0
    sla_weight = db.Column(db.Float, nullable=False)              # 0.0-1.0
    working_capital_limit = db.Column(db.Float, nullable=False)   # USD
    customer_churn_sensitivity = db.Column(db.Float, nullable=False)
    sla_target_percent = db.Column(db.Float, nullable=False)      # e.g. 0.97


class Disruption(db.Model, TimestampMixin):
    """Port disruption event driving the exposure → strategy → recommendation pipeline."""
    __tablename__ = "disruptions"

    id = db.Column(db.Integer, primary_key=True)
    port_code = db.Column(db.String(16), db.ForeignKey("ports.code"), nullable=False)
    disruption_type = db.Column(db.String(50), nullable=False)    # labor_strike | weather | congestion
    severity_score = db.Column(db.Float, nullable=False)          # 0.0-1.0
    expected_delay_days = db.Column(db.Integer, nullable=False)
    confidence_score = db.Column(db.Float, nullable=False)        # 0.0-1.0
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    detected_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    resolved_at = db.Column(db.DateTime, nullable=True)


class Strategy(db.Model):
    """Predefined mitigation strategy template (S1-S4 per kmi.tex)."""
    __tablename__ = "strategies"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=True)
    air_freight_percent = db.Column(db.Float, nullable=False)     # 0.0-1.0
    reroute_percent = db.Column(db.Float, nullable=False)
    buffer_stock_percent = db.Column(db.Float, nullable=False)
    cost_multiplier_air = db.Column(db.Float, default=8.0, nullable=False)
    cost_multiplier_reroute = db.Column(db.Float, default=1.3, nullable=False)
    holding_cost_per_unit_per_day = db.Column(db.Float, default=0.50, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)


class MitigationRecommendation(db.Model, TimestampMixin):
    """Final recommendation with LLM-generated action drafts and approval workflow."""
    __tablename__ = "mitigation_recommendations"

    id = db.Column(db.Integer, primary_key=True)
    disruption_id = db.Column(db.Integer, db.ForeignKey("disruptions.id"), nullable=False)
    strategy_id = db.Column(db.Integer, db.ForeignKey("strategies.id"), nullable=False)
    confidence_score = db.Column(db.Float, nullable=False)
    reasoning = db.Column(db.Text, nullable=False)
    revenue_preserved = db.Column(db.Float, nullable=False)
    mitigation_cost = db.Column(db.Float, nullable=False)
    sla_achieved = db.Column(db.Float, nullable=False)
    sla_penalty_cost = db.Column(db.Float, default=0, nullable=False)
    net_financial_impact = db.Column(db.Float, nullable=False)
    generated_email_supplier = db.Column(db.Text, nullable=True)
    generated_email_logistics = db.Column(db.Text, nullable=True)
    generated_executive_summary = db.Column(db.Text, nullable=True)
    requires_approval = db.Column(db.Boolean, default=True, nullable=False)
    approved_by = db.Column(db.String(255), nullable=True)
    approved_at = db.Column(db.DateTime, nullable=True)
