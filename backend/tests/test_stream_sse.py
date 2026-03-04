import json
from datetime import datetime

from models import RiskEvent, db


def test_stream_sse_emits_events(client, app):
    with app.app_context():
        db.session.add(
            RiskEvent(
                event_type='WEATHER',
                title='SSE storm',
                summary='Storm for stream',
                severity=75,
                confidence=0.8,
                source='open-meteo',
                source_url='https://example.com/stream',
                published_at=datetime(2026, 3, 3),
                impacted_ports=['USLAX'],
                impacted_countries=['US'],
                impacted_keywords=['storm'],
                dedupe_key='sse-key-1',
                metadata_json={},
            )
        )
        db.session.commit()

    resp = client.get('/api/stream/events?backfill=1', buffered=False)
    chunk = next(resp.response).decode('utf-8')

    assert 'event:' in chunk
    assert 'data:' in chunk
    data_line = [line for line in chunk.splitlines() if line.startswith('data: ')][0]
    payload = json.loads(data_line.replace('data: ', '', 1))
    assert payload['title'] == 'SSE storm'
    assert payload['stream_phase'] == 'backfill'
