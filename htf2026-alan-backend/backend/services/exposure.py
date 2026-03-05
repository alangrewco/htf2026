"""
Exposure Analysis Engine — ported from HTF_Hackathonb
=====================================================
Criticality-weighted risk scoring with Newsvendor safety stock model.
Adapted from FastAPI/Pydantic/UUID to Flask-SQLAlchemy integer-PK arch.

Key features:
  • Criticality-weighted risk scoring (nonlinear, CriticalityScore^λ)
  • Newsvendor safety stock model (z_α × σ_demand × √LeadTime)
  • Service risk grades (A/B/C/D/F) based on coverage ratio
  • Inventory runway + stockout date projection
"""

from __future__ import annotations

import math
from datetime import date, timedelta

from models import Disruption, Inventory, SKU, Shipment, db


# Criticality amplification exponent (>1 = nonlinear priority for critical SKUs)
CRITICALITY_LAMBDA = 1.5

# Demand variability coefficient (for Newsvendor)
DEMAND_CV = 0.15  # 15% coefficient of variation (typical for electronics)

# Service level for safety stock (97% = z ≈ 1.88)
SERVICE_LEVEL_Z = 1.88


def _newsvendor_safety_stock(daily_demand: int, lead_time_days: int) -> int:
    """
    Classical Newsvendor safety stock:
    SafetyStock = z_α × σ_demand × √(LeadTime)
    """
    sigma_demand = daily_demand * DEMAND_CV
    safety = SERVICE_LEVEL_Z * sigma_demand * math.sqrt(max(1, lead_time_days))
    return max(0, int(round(safety)))


def _risk_grade(coverage_ratio: float) -> str:
    """
    A-F risk grade based on inventory coverage ratio.
    Coverage = OnHand / (DailyDemand × ExpectedDelay)
    """
    if coverage_ratio >= 1.50:
        return "A"
    elif coverage_ratio >= 1.00:
        return "B"
    elif coverage_ratio >= 0.50:
        return "C"
    elif coverage_ratio >= 0.25:
        return "D"
    else:
        return "F"


def calculate_exposure(disruption_id: int) -> dict:
    """
    Calculate financial exposure for all SKUs affected by a disruption.
    Returns a dict with the full exposure breakdown.
    """
    disruption = Disruption.query.get(disruption_id)
    if not disruption:
        raise ValueError(f"Disruption {disruption_id} not found")

    # Get all shipments heading to the disrupted port
    shipments = Shipment.query.filter(
        (Shipment.dest_port == disruption.port_code)
        | (Shipment.origin_port == disruption.port_code)
    ).all()

    if not shipments:
        return _empty_result(disruption_id, disruption.port_code)

    sku_ids = list(set(s.sku_id for s in shipments))
    skus = SKU.query.filter(SKU.id.in_(sku_ids)).all()
    inventories = Inventory.query.filter(Inventory.sku_id.in_(sku_ids)).all()
    inventory_map = {inv.sku_id: inv for inv in inventories}

    shipments_by_sku: dict[int, list] = {}
    for s in shipments:
        shipments_by_sku.setdefault(s.sku_id, []).append(s)

    # Calculate metrics per SKU
    affected_skus = []
    total_revenue_risk = 0.0
    total_margin_risk = 0.0
    total_qty = 0

    for sku in skus:
        inv = inventory_map.get(sku.id)
        on_hand = inv.on_hand if inv else 0

        # Use revenue_impact_per_day_stockout as daily_demand proxy for exposure
        daily_demand = getattr(sku, "revenue_impact_per_day_stockout", 0) or 0
        unit_cost = sku.unit_cost or 0.0

        # Runway calculation
        runway_days = int(on_hand / daily_demand) if daily_demand > 0 else 999
        stockout_date_val = date.today() + timedelta(days=runway_days)

        # Delay gap
        delay_gap = max(0, disruption.expected_delay_days - runway_days)

        # Revenue at risk (unit_cost used as proxy for unit_price)
        base_revenue_risk = delay_gap * daily_demand * unit_cost
        base_margin_risk = base_revenue_risk * 0.28  # 28% gross margin assumption

        total_revenue_risk += base_revenue_risk
        total_margin_risk += base_margin_risk

        sku_shipments = shipments_by_sku.get(sku.id, [])
        total_qty += len(sku_shipments)

        # Safety stock
        safety_stock = _newsvendor_safety_stock(int(daily_demand), disruption.expected_delay_days)

        # Coverage ratio and risk grade
        required_stock = daily_demand * disruption.expected_delay_days
        coverage_ratio = on_hand / required_stock if required_stock > 0 else 999.0
        risk_grade_val = _risk_grade(coverage_ratio)

        affected_skus.append({
            "sku_id": sku.id,
            "sku_name": sku.name,
            "on_hand_units": on_hand,
            "daily_demand": daily_demand,
            "unit_cost": unit_cost,
            "inventory_runway_days": runway_days,
            "stockout_date": stockout_date_val.isoformat(),
            "delay_gap_days": delay_gap,
            "revenue_at_risk": round(base_revenue_risk, 2),
            "margin_at_risk": round(base_margin_risk, 2),
            "safety_stock": safety_stock,
            "coverage_ratio": round(coverage_ratio, 2),
            "risk_grade": risk_grade_val,
            "affected_shipment_ids": [s.id for s in sku_shipments],
        })

    # Sort by revenue at risk (highest first)
    affected_skus.sort(key=lambda s: s["revenue_at_risk"], reverse=True)

    return {
        "disruption_id": disruption_id,
        "port_code": disruption.port_code,
        "affected_skus": affected_skus,
        "total_revenue_at_risk": round(total_revenue_risk, 2),
        "total_margin_at_risk": round(total_margin_risk, 2),
        "total_affected_shipments": len(shipments),
        "total_affected_skus": len(skus),
    }


def _empty_result(disruption_id: int, port_code: str) -> dict:
    return {
        "disruption_id": disruption_id,
        "port_code": port_code,
        "affected_skus": [],
        "total_revenue_at_risk": 0.0,
        "total_margin_at_risk": 0.0,
        "total_affected_shipments": 0,
        "total_affected_skus": 0,
    }
