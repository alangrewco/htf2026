"""
Strategy Optimization Engine — ported from HTF_Hackathonb
=========================================================
Evaluates predefined mitigation strategies using Risk DNA weighted
objective function. Simplified from TOPSIS+MILP to pure enumeration
to avoid PuLP/NumPy dependency in the lean alan-backend.

Original features kept:
  • Risk DNA weighted objective: max α·R − β·C − δ·P
  • Working capital feasibility constraint
  • SLA penalty calculation
"""

from __future__ import annotations

from models import Company, Disruption, Strategy
from services.exposure import calculate_exposure


OCEAN_COST_PER_UNIT = 30.0  # USD baseline per container unit


def simulate_strategies(disruption_id: int) -> dict:
    """
    Evaluate all active strategies for a disruption and select the optimal one.
    Returns strategy comparison with financial metrics.
    """
    disruption = Disruption.query.get(disruption_id)
    if not disruption:
        raise ValueError(f"Disruption {disruption_id} not found")

    strategies = Strategy.query.filter_by(is_active=True).all()
    if not strategies:
        raise ValueError("No active strategies found")

    exposure = calculate_exposure(disruption_id)
    company = Company.query.first()
    if not company:
        raise ValueError("No company profile found. Run seed first.")

    # Risk DNA parameters
    alpha = company.risk_tolerance
    beta = 1.0 - alpha
    delta = company.sla_weight * company.customer_churn_sensitivity

    simulations = []
    best_score = float("-inf")
    optimal_strategy_id = None

    for strategy in strategies:
        result = _evaluate_strategy(strategy, disruption, exposure, company, alpha, beta, delta)
        simulations.append(result)

        if result["is_feasible"] and result["weighted_score"] > best_score:
            best_score = result["weighted_score"]
            optimal_strategy_id = strategy.id

    return {
        "disruption_id": disruption_id,
        "simulations": simulations,
        "optimal_strategy_id": optimal_strategy_id or (strategies[0].id if strategies else None),
        "company_risk_profile": {
            "risk_tolerance": company.risk_tolerance,
            "working_capital_limit": company.working_capital_limit,
            "sla_target_percent": company.sla_target_percent,
            "sla_weight": company.sla_weight,
            "optimization_method": "Risk DNA enumeration",
        },
    }


def _evaluate_strategy(
    strategy: Strategy,
    disruption: Disruption,
    exposure: dict,
    company: Company,
    alpha: float,
    beta: float,
    delta: float,
) -> dict:
    """Evaluate a single strategy template against the disruption exposure."""
    total_shipments = exposure["total_affected_shipments"]

    # 1. Mitigation cost
    air_qty = total_shipments * strategy.air_freight_percent
    reroute_qty = total_shipments * strategy.reroute_percent
    buffer_qty = total_shipments * strategy.buffer_stock_percent

    air_cost = air_qty * OCEAN_COST_PER_UNIT * strategy.cost_multiplier_air
    reroute_cost = reroute_qty * OCEAN_COST_PER_UNIT * strategy.cost_multiplier_reroute
    buffer_cost = buffer_qty * strategy.holding_cost_per_unit_per_day * disruption.expected_delay_days
    mitigation_cost = air_cost + reroute_cost + buffer_cost

    # 2. Feasibility: working capital constraint
    is_feasible = mitigation_cost <= company.working_capital_limit
    feasibility_reason = None
    if not is_feasible:
        feasibility_reason = (
            f"Cost (${mitigation_cost:,.0f}) exceeds "
            f"capital limit (${company.working_capital_limit:,.0f})"
        )

    # 3. Revenue preserved (effectiveness-weighted)
    effectiveness = (
        strategy.air_freight_percent * 1.0
        + strategy.reroute_percent * 0.8
        + strategy.buffer_stock_percent * 0.5
    )
    revenue_preserved = exposure["total_revenue_at_risk"] * effectiveness
    margin_preserved = exposure["total_margin_at_risk"] * effectiveness

    # 4. SLA penalty
    base_sla_drop = disruption.expected_delay_days / 100.0
    sla_achieved = company.sla_target_percent - base_sla_drop + (base_sla_drop * effectiveness)

    sla_penalty_cost = 0.0
    if sla_achieved < company.sla_target_percent:
        penalty_pts = company.sla_target_percent - sla_achieved
        sla_penalty_cost = (
            penalty_pts * 100 * company.revenue_annual_millions * 10000 * company.sla_weight
        )

    # 5. Net financial impact
    net_impact = revenue_preserved - mitigation_cost - sla_penalty_cost

    # 6. Risk DNA weighted score
    weighted_score = alpha * revenue_preserved - beta * mitigation_cost - delta * sla_penalty_cost

    return {
        "strategy_id": strategy.id,
        "strategy_name": strategy.name,
        "description": strategy.description or "",
        "revenue_preserved": round(revenue_preserved, 2),
        "margin_preserved": round(margin_preserved, 2),
        "mitigation_cost": round(mitigation_cost, 2),
        "sla_achieved": round(sla_achieved, 4),
        "sla_penalty_cost": round(sla_penalty_cost, 2),
        "net_financial_impact": round(net_impact, 2),
        "working_capital_required": round(mitigation_cost, 2),
        "effectiveness": round(effectiveness, 2),
        "weighted_score": round(weighted_score, 2),
        "is_feasible": is_feasible,
        "feasibility_reason": feasibility_reason,
    }
