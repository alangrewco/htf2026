from datetime import datetime

from models import RiskEvent, db


def test_shipment_risk_matching(client, app):
    with app.app_context():
        db.session.add(
            RiskEvent(
                event_type='NEWS',
                title='Port disruption',
                summary='Issue at LAX',
                severity=70,
                confidence=0.7,
                source='gdelt',
                source_url='https://example.com/lax',
                published_at=datetime(2026, 3, 3),
                impacted_ports=['USLAX'],
                impacted_countries=['US'],
                impacted_keywords=['congestion'],
                dedupe_key='ship-risk-1',
                metadata_json={},
            )
        )
        db.session.commit()

    resp = client.get('/api/shipments/1/risks')
    assert resp.status_code == 200
    payload = resp.get_json()
    assert len(payload) == 1
    assert payload[0]['title'] == 'Port disruption'
