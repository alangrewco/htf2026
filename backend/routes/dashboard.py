"""
Dashboard Blueprint — ported from HTF_Hackathonb routers/dashboard.py
=====================================================================
Aggregated dashboard summary with company profile, active disruptions,
and key financial metrics.
"""

from __future__ import annotations

from flask import abort
from flask.views import MethodView
from flask_smorest import Blueprint

from models import (
    Company,
    Disruption,
    Inventory,
    MitigationRecommendation,
    SKU,
    Shipment,
    Strategy,
    db,
)

blp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard", description="Dashboard")


@blp.route("")
class DashboardResource(MethodView):
    @blp.doc(tags=["dashboard"])
    def get(self):
        """Main dashboard data load."""
        company = Company.query.first()
        if not company:
            abort(404, description="No company found. Run seed first.")

        company_dict = {
            "id": company.id,
            "name": company.name,
            "revenue_annual_millions": company.revenue_annual_millions,
            "gross_margin_percent": company.gross_margin_percent,
            "risk_tolerance": company.risk_tolerance,
            "sla_weight": company.sla_weight,
            "working_capital_limit": company.working_capital_limit,
            "sla_target_percent": company.sla_target_percent,
        }

        # Get all active disruptions
        active_disruptions = Disruption.query.filter_by(is_active=True).all()
        disruption_dicts = [
            {
                "id": d.id,
                "port_code": d.port_code,
                "disruption_type": d.disruption_type,
                "severity_score": d.severity_score,
                "expected_delay_days": d.expected_delay_days,
                "confidence_score": d.confidence_score,
                "is_active": d.is_active,
                "detected_at": d.detected_at.isoformat() if d.detected_at else None,
            }
            for d in active_disruptions
        ]

        # Primary disruption (highest severity)
        primary = max(active_disruptions, key=lambda d: d.severity_score) if active_disruptions else None

        # Aggregate metrics
        revenue_risk = 0.0
        affected_sku_ids = set()
        affected_shipment_count = 0

        for disruption in active_disruptions:
            shipments = Shipment.query.filter(
                (Shipment.dest_port == disruption.port_code)
                | (Shipment.origin_port == disruption.port_code)
            ).all()

            if shipments:
                sku_ids = list(set(s.sku_id for s in shipments))
                affected_shipment_count += len(shipments)
                affected_sku_ids.update(sku_ids)

                skus = SKU.query.filter(SKU.id.in_(sku_ids)).all()
                inventory_map = {
                    i.sku_id: i.on_hand
                    for i in Inventory.query.filter(Inventory.sku_id.in_(sku_ids)).all()
                }

                for sku in skus:
                    on_hand = inventory_map.get(sku.id, 0)
                    daily_demand = getattr(sku, "revenue_impact_per_day_stockout", 0) or 0
                    runway = int(on_hand / daily_demand) if daily_demand > 0 else 999
                    delay_gap = max(0, disruption.expected_delay_days - runway)
                    revenue_risk += delay_gap * daily_demand * (sku.unit_cost or 0)

        # Latest recommendation for primary disruption
        recommendation_dict = None
        if primary:
            latest_rec = (
                MitigationRecommendation.query.filter_by(disruption_id=primary.id)
                .order_by(MitigationRecommendation.created_at.desc())
                .first()
            )
            if latest_rec:
                strategy = Strategy.query.get(latest_rec.strategy_id)
                recommendation_dict = {
                    "id": latest_rec.id,
                    "strategy_name": strategy.name if strategy else "Unknown",
                    "net_financial_impact": latest_rec.net_financial_impact,
                    "revenue_preserved": latest_rec.revenue_preserved,
                    "mitigation_cost": latest_rec.mitigation_cost,
                    "sla_achieved": latest_rec.sla_achieved,
                    "requires_approval": latest_rec.requires_approval,
                    "approved_by": latest_rec.approved_by,
                }

        return {
            "company": company_dict,
            "active_disruptions": disruption_dicts,
            "primary_disruption": disruption_dicts[0] if disruption_dicts else None,
            "active_recommendation": recommendation_dict,
            "total_revenue_at_risk": round(revenue_risk, 2) if revenue_risk > 0 else None,
            "key_metrics": {
                "affected_skus": len(affected_sku_ids),
                "affected_shipments": affected_shipment_count,
                "active_disruption_count": len(active_disruptions),
            },
        }
