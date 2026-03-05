from datetime import datetime

from models import RiskEvent, db


def test_events_filter_and_list(client, app):
    with app.app_context():
        event = RiskEvent(
            event_type='WEATHER',
            title='Storm alert',
            summary='High waves',
            severity=80,
            confidence=0.8,
            source='open-meteo',
            source_url='https://example.com/weather',
            published_at=datetime(2026, 3, 3),
            impacted_ports=['USLAX'],
            impacted_countries=['US'],
            impacted_keywords=['storm'],
            dedupe_key='weather:test:1',
            metadata_json={},
        )
        db.session.add(event)
        db.session.commit()

    resp = client.get('/api/events?type=WEATHER&min_severity=50')
    assert resp.status_code == 200
    data = resp.get_json()
    assert len(data) == 1
    assert data[0]['title'] == 'Storm alert'


def test_dedupe_key_uniqueness(app):
    with app.app_context():
        one = RiskEvent(
            event_type='NEWS',
            title='Port strike',
            summary='Labor issues',
            severity=60,
            confidence=0.6,
            source='gdelt',
            source_url='https://example.com/news',
            impacted_ports=['CNSHA'],
            impacted_countries=['CN'],
            impacted_keywords=['strike'],
            dedupe_key='dup-key',
            metadata_json={},
        )
        db.session.add(one)
        db.session.commit()

        two = RiskEvent(
            event_type='NEWS',
            title='Port strike duplicate',
            summary='Labor issues duplicate',
            severity=61,
            confidence=0.6,
            source='gdelt',
            source_url='https://example.com/news2',
            impacted_ports=['CNSHA'],
            impacted_countries=['CN'],
            impacted_keywords=['strike'],
            dedupe_key='dup-key',
            metadata_json={},
        )
        db.session.add(two)
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()

        assert RiskEvent.query.filter_by(dedupe_key='dup-key').count() == 1
