"""
Disruptions Blueprint — ported from HTF_Hackathonb routers/disruptions.py
=========================================================================
Full disruption CRUD + exposure/strategy/recommendation pipeline.
"""

from __future__ import annotations

from datetime import datetime

from flask import abort
from flask.views import MethodView
from flask_smorest import Blueprint
from marshmallow import Schema, fields

from extensions import limiter
from models import Company, Disruption, MitigationRecommendation, Port, Strategy, db
from services.exposure import calculate_exposure
from services.llm_generator import generate_mitigation_drafts
from services.optimizer import simulate_strategies

blp = Blueprint("disruptions", __name__, url_prefix="/api/disruptions", description="Disruptions")


class DisruptionCreateSchema(Schema):
    port_code = fields.String(required=True)
    disruption_type = fields.String(required=True)
    expected_delay_days = fields.Integer(required=True)
    severity_score = fields.Float(required=False, load_default=0.8)
    confidence_score = fields.Float(required=False, load_default=0.7)


class DisruptionResolveSchema(Schema):
    notes = fields.String(required=False)


@blp.route("")
class DisruptionListResource(MethodView):
    decorators = [limiter.limit("10/minute")]

    @blp.doc(tags=["disruptions"])
    def get(self):
        """List all disruptions (active first)."""
        disruptions = Disruption.query.order_by(
            Disruption.is_active.desc(), Disruption.created_at.desc()
        ).all()
        return [_disruption_to_dict(d) for d in disruptions]

    @limiter.limit("5/minute")
    @blp.arguments(DisruptionCreateSchema)
    @blp.doc(tags=["disruptions"])
    def post(self, payload):
        """Create a new disruption and trigger the analysis pipeline."""
        port = Port.query.filter_by(code=payload["port_code"]).first()
        if not port:
            abort(404, description="Port not found")

        disruption = Disruption(
            port_code=payload["port_code"],
            disruption_type=payload["disruption_type"],
            expected_delay_days=payload["expected_delay_days"],
            severity_score=payload["severity_score"],
            confidence_score=payload["confidence_score"],
            is_active=True,
            detected_at=datetime.utcnow(),
        )
        db.session.add(disruption)
        db.session.commit()
        return _disruption_to_dict(disruption), 201


@blp.route("/<int:disruption_id>")
class DisruptionDetailResource(MethodView):
    @blp.doc(tags=["disruptions"])
    def get(self, disruption_id: int):
        disruption = Disruption.query.get(disruption_id)
        if not disruption:
            abort(404, description="Disruption not found")
        return _disruption_to_dict(disruption)


@blp.route("/<int:disruption_id>/exposure")
class DisruptionExposureResource(MethodView):
    @blp.doc(tags=["disruptions"])
    def get(self, disruption_id: int):
        """Calculate and return financial exposure for a disruption."""
        try:
            return calculate_exposure(disruption_id)
        except ValueError as e:
            abort(404, description=str(e))


@blp.route("/<int:disruption_id>/strategies")
class DisruptionStrategiesResource(MethodView):
    @blp.doc(tags=["disruptions"])
    def get(self, disruption_id: int):
        """Simulate all strategies and return comparison."""
        try:
            return simulate_strategies(disruption_id)
        except ValueError as e:
            abort(404, description=str(e))


@blp.route("/<int:disruption_id>/recommendation")
class DisruptionRecommendationResource(MethodView):
    decorators = [limiter.limit("3/minute")]

    @blp.doc(tags=["disruptions"])
    def get(self, disruption_id: int):
        """Get or create recommendation with LLM-generated drafts."""
        # Check for existing recommendation
        existing = MitigationRecommendation.query.filter_by(
            disruption_id=disruption_id
        ).first()
        if existing:
            return _recommendation_to_dict(existing)

        # Generate via full pipeline
        try:
            comparison = simulate_strategies(disruption_id)
        except ValueError as e:
            abort(404, description=str(e))

        optimal_id = comparison["optimal_strategy_id"]
        optimal_sim = next(
            (s for s in comparison["simulations"] if s["strategy_id"] == optimal_id),
            None,
        )
        if not optimal_sim:
            abort(500, description="Could not determine optimal strategy")

        strategy = Strategy.query.get(optimal_id)
        disruption = Disruption.query.get(disruption_id)
        port = Port.query.filter_by(code=disruption.port_code).first()
        company = Company.query.first()
        exposure = calculate_exposure(disruption_id)

        # LLM drafts
        drafts = generate_mitigation_drafts(
            company_name=company.name if company else "Apex Electronics",
            disruption_type=disruption.disruption_type,
            port_name=port.name if port else disruption.port_code,
            delay_days=disruption.expected_delay_days,
            affected_skus_count=exposure["total_affected_skus"],
            revenue_at_risk=exposure["total_revenue_at_risk"],
            strategy_name=strategy.name,
            air_percent=strategy.air_freight_percent,
            reroute_percent=strategy.reroute_percent,
            buffer_percent=strategy.buffer_stock_percent,
            risk_tolerance=company.risk_tolerance if company else 0.3,
            sla_target=company.sla_target_percent if company else 0.97,
            working_capital=company.working_capital_limit if company else 5000000,
        )

        reasoning = "\n".join([
            f"Selected '{strategy.name}' based on net financial impact of ${optimal_sim['net_financial_impact']:,.0f}.",
            f"Requires ${optimal_sim['mitigation_cost']:,.0f} of ${company.working_capital_limit:,.0f} working capital." if company else "",
            f"Achieves {optimal_sim['sla_achieved']:.1%} service level.",
        ])

        rec = MitigationRecommendation(
            disruption_id=disruption_id,
            strategy_id=strategy.id,
            confidence_score=disruption.confidence_score,
            reasoning=reasoning,
            revenue_preserved=optimal_sim["revenue_preserved"],
            mitigation_cost=optimal_sim["mitigation_cost"],
            sla_achieved=optimal_sim["sla_achieved"],
            sla_penalty_cost=optimal_sim["sla_penalty_cost"],
            net_financial_impact=optimal_sim["net_financial_impact"],
            generated_email_supplier=drafts.get("supplier_email"),
            generated_email_logistics=drafts.get("logistics_email"),
            generated_executive_summary=drafts.get("executive_summary"),
            requires_approval=True,
        )
        db.session.add(rec)
        db.session.commit()
        return _recommendation_to_dict(rec), 201


@blp.route("/<int:disruption_id>/resolve")
class DisruptionResolveResource(MethodView):
    @blp.arguments(DisruptionResolveSchema)
    @blp.doc(tags=["disruptions"])
    def post(self, payload, disruption_id: int):
        """Mark a disruption as resolved."""
        disruption = Disruption.query.get(disruption_id)
        if not disruption:
            abort(404, description="Disruption not found")
        disruption.is_active = False
        disruption.resolved_at = datetime.utcnow()
        db.session.commit()
        return _disruption_to_dict(disruption)


# ── Helpers ──────────────────────────────────────────────────────────────

def _disruption_to_dict(d: Disruption) -> dict:
    return {
        "id": d.id,
        "port_code": d.port_code,
        "disruption_type": d.disruption_type,
        "severity_score": d.severity_score,
        "expected_delay_days": d.expected_delay_days,
        "confidence_score": d.confidence_score,
        "is_active": d.is_active,
        "detected_at": d.detected_at.isoformat() if d.detected_at else None,
        "resolved_at": d.resolved_at.isoformat() if d.resolved_at else None,
        "created_at": d.created_at.isoformat() if d.created_at else None,
    }


def _recommendation_to_dict(r: MitigationRecommendation) -> dict:
    return {
        "id": r.id,
        "disruption_id": r.disruption_id,
        "strategy_id": r.strategy_id,
        "confidence_score": r.confidence_score,
        "reasoning": r.reasoning,
        "revenue_preserved": r.revenue_preserved,
        "mitigation_cost": r.mitigation_cost,
        "sla_achieved": r.sla_achieved,
        "sla_penalty_cost": r.sla_penalty_cost,
        "net_financial_impact": r.net_financial_impact,
        "generated_email_supplier": r.generated_email_supplier,
        "generated_email_logistics": r.generated_email_logistics,
        "generated_executive_summary": r.generated_executive_summary,
        "requires_approval": r.requires_approval,
        "approved_by": r.approved_by,
        "approved_at": r.approved_at.isoformat() if r.approved_at else None,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    }
