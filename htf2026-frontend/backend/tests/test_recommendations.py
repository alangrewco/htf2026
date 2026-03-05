from datetime import datetime

from models import RiskEvent, db


def test_generate_recommendations_deterministic(client, app):
    with app.app_context():
        db.session.add(
            RiskEvent(
                event_type='WEATHER',
                title='Shanghai weather warning',
                summary='Bad weather',
                severity=80,
                confidence=0.8,
                source='open-meteo',
                source_url='https://example.com/weather',
                published_at=datetime(2026, 3, 3),
                impacted_ports=['CNSHA'],
                impacted_countries=['CN'],
                impacted_keywords=['weather'],
                dedupe_key='rec-risk-1',
                metadata_json={},
            )
        )
        db.session.commit()

    payload = {'profile': 'resilient', 'sku_ids': [1, 2], 'horizon_days': 30}
    resp = client.post('/api/recommendations/generate', json=payload)
    assert resp.status_code == 200
    data = resp.get_json()
    assert len(data['recommendations']) == 2
    assert set(data['weights'].keys()) == {'w_cost', 'w_speed', 'w_risk'}
