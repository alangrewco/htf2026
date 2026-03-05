"""
LLM Action Draft Generator — ported from HTF_Hackathonb
========================================================
Generates supplier emails, logistics requests, and executive summaries
using Gemini. Falls back to template-based drafts if API unavailable.

Reuses the google-adk dependency already in requirements.txt.
"""

from __future__ import annotations

import os


def generate_mitigation_drafts(
    company_name: str,
    disruption_type: str,
    port_name: str,
    delay_days: int,
    affected_skus_count: int,
    revenue_at_risk: float,
    strategy_name: str,
    air_percent: float,
    reroute_percent: float,
    buffer_percent: float,
    risk_tolerance: float,
    sla_target: float,
    working_capital: float,
) -> dict[str, str]:
    """
    Generate three draft communications using Gemini.
    Returns dict with keys: supplier_email, logistics_email, executive_summary
    """
    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    if not api_key:
        return _fallback_templates(
            company_name=company_name,
            port_name=port_name,
            delay_days=delay_days,
            strategy_name=strategy_name,
            revenue_at_risk=revenue_at_risk,
        )

    prompt = f"""You are a VP of Supply Chain at {company_name}, a mid-market electronics manufacturer.
A critical supply chain disruption requires immediate action.

DISRUPTION DETAILS:
- Location: {port_name}
- Type: {disruption_type.replace('_', ' ').title()}
- Expected Delay: {delay_days} days
- Affected SKUs: {affected_skus_count} high-priority items
- Revenue at Risk: ${revenue_at_risk:,.0f}

COMPANY RISK PROFILE:
- Risk Tolerance: {'Low' if risk_tolerance < 0.4 else 'Medium' if risk_tolerance < 0.7 else 'High'} ({risk_tolerance:.0%})
- SLA Target: {sla_target:.0%}
- Working Capital Available: ${working_capital:,.0f}

SELECTED MITIGATION STRATEGY: {strategy_name}
- Reroute {reroute_percent:.0%} of shipments via alternate port
- Air freight {air_percent:.0%} of most critical SKUs
- Build buffer stock for {buffer_percent:.0%} of affected items

Generate the following three items clearly separated by '---':

1. SUPPLIER EMAIL: Professional email to primary supplier requesting rerouting.
---
2. LOGISTICS REQUEST: Formal request to freight forwarder for air freight booking.
---
3. EXECUTIVE SUMMARY: Three bullet points for COO briefing.

Be concise, professional, and specific. Do not use placeholders."""

    try:
        # Reuse the existing google-adk pattern from adk_agent.py
        from google.genai import types
        from google.adk.agents import LlmAgent
        from google.adk.runners import InMemoryRunner
        import uuid

        model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-pro")
        agent = LlmAgent(
            name="draft_generator",
            model=model_name,
            instruction="Return professional supply chain communications only.",
        )
        runner = InMemoryRunner(agent=agent, app_name="harborguard-drafts")

        user_id = "single_tenant_company"
        session_id = str(uuid.uuid4())
        runner.session_service.create_session(
            app_name="harborguard-drafts",
            user_id=user_id,
            session_id=session_id,
        )

        content = types.Content(role="user", parts=[types.Part(text=prompt)])
        last_text = None
        for event in runner.run(user_id=user_id, session_id=session_id, new_message=content):
            event_content = getattr(event, "content", None)
            if not event_content or not getattr(event_content, "parts", None):
                continue
            parts_text = [
                getattr(part, "text", None)
                for part in event_content.parts
                if getattr(part, "text", None)
            ]
            if parts_text:
                last_text = "\n".join(parts_text)

        if last_text:
            sections = [s.strip() for s in last_text.split("---") if s.strip()]
            return {
                "supplier_email": sections[0] if len(sections) > 0 else last_text[:1000],
                "logistics_email": sections[1] if len(sections) > 1 else last_text[1000:2000],
                "executive_summary": sections[2] if len(sections) > 2 else last_text[-500:],
            }

    except Exception:
        pass

    return _fallback_templates(
        company_name=company_name,
        port_name=port_name,
        delay_days=delay_days,
        strategy_name=strategy_name,
        revenue_at_risk=revenue_at_risk,
    )


def _fallback_templates(**kwargs) -> dict[str, str]:
    """Hardcoded fallback if Gemini API fails or is not configured."""
    port = kwargs.get("port_name", "affected port")
    revenue = kwargs.get("revenue_at_risk", 0)
    company = kwargs.get("company_name", "Our Company")
    strategy = kwargs.get("strategy_name", "Split Strategy")
    delay = kwargs.get("delay_days", 12)

    return {
        "supplier_email": (
            f"Subject: Urgent: Reroute Required - {port} Disruption\n\n"
            f"Dear Supplier,\n\n"
            f"Due to the ongoing disruption at {port} (expected {delay}-day delay), "
            f"we need to immediately reroute all in-transit containers to an alternate port. "
            f"This action is part of our '{strategy}' mitigation plan to protect "
            f"${revenue:,.0f} in revenue at risk.\n\n"
            f"Please confirm receipt and provide updated ETAs within 4 hours.\n\n"
            f"Best regards,\nVP Supply Chain, {company}"
        ),
        "logistics_email": (
            f"Subject: Emergency Air Freight Booking - {port} Disruption\n\n"
            f"Please execute emergency air freight booking for priority SKUs "
            f"and coordinate rerouting per the '{strategy}' plan. "
            f"Timeline: immediate execution within 24 hours.\n\n"
            f"Regards,\nLogistics Team, {company}"
        ),
        "executive_summary": (
            f"• Situation: {port} disruption threatening ${revenue:,.0f} revenue "
            f"with expected {delay}-day delay\n"
            f"• Action: '{strategy}' selected as optimal mitigation\n"
            f"• Timeline: Execute within 24 hours to minimize SLA impact"
        ),
    }
