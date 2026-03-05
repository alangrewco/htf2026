from __future__ import annotations

from models import RiskEvent, Shipment


def shipment_matches_event(shipment: Shipment, event: RiskEvent) -> bool:
    impacted_ports = set(event.impacted_ports or [])
    impacted_countries = set(event.impacted_countries or [])

    port_match = shipment.origin_port in impacted_ports or shipment.dest_port in impacted_ports

    # Minimal country rule for demo: compare against first two chars if country codes embedded.
    country_match = False
    for p in impacted_ports:
        if len(p) >= 2 and (
            shipment.origin_port.startswith(p[:2]) or shipment.dest_port.startswith(p[:2])
        ):
            country_match = True
            break

    if impacted_countries:
        country_match = country_match or any(
            shipment.origin_port.startswith(c) or shipment.dest_port.startswith(c)
            for c in impacted_countries
        )

    return port_match or country_match


def matched_events_for_shipment(shipment: Shipment, min_severity: int = 0) -> list[RiskEvent]:
    events = RiskEvent.query.filter(RiskEvent.severity >= min_severity).all()
    return [event for event in events if shipment_matches_event(shipment, event)]
