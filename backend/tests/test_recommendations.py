from datetime import datetime

from models import ResearchFinding, ResearchTask, RiskEvent, db


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


def test_generate_recommendations_uses_findings_evidence(client, app):
    with app.app_context():
        event = RiskEvent(
            event_type='NEWS',
            title='Labor strike risk at Los Angeles',
            summary='Operations impacted',
            severity=70,
            confidence=0.8,
            source='gdelt',
            source_url='https://example.com/strike',
            published_at=datetime(2026, 3, 3),
            impacted_ports=['USLAX'],
            impacted_countries=['US'],
            impacted_keywords=['strike'],
            dedupe_key='rec-findings-risk-1',
            metadata_json={},
        )
        db.session.add(event)
        db.session.flush()
        task = ResearchTask(event_id=event.id, mode='enrich', status='done')
        db.session.add(task)
        db.session.flush()
        db.session.add(
            ResearchFinding(
                task_id=task.id,
                event_id=event.id,
                finding_json={
                    'event_type': 'NEWS',
                    'title': event.title,
                    'summary': event.summary,
                    'severity': 85,
                    'confidence': 0.9,
                    'impacted': {'ports': ['USLAX'], 'countries': ['US'], 'keywords': ['strike']},
                    'time_window': {'start': '2026-03-03T00:00:00', 'end': '2026-03-10T00:00:00'},
                    'recommended_actions': [
                        {'action': 'Reroute to Tacoma', 'rationale': 'Avoid labor slowdown'}
                    ],
                    'citations': [{'url': 'https://example.com/strike', 'note': 'source'}],
                    '_meta': {'enrichment_source': 'adk'},
                },
            )
        )
        db.session.commit()

    payload = {'profile': 'resilient', 'sku_ids': [1], 'horizon_days': 30}
    resp = client.post('/api/recommendations/generate', json=payload)
    assert resp.status_code == 200
    data = resp.get_json()
    rec = data['recommendations'][0]['recommendation']
    assert 'evidence_summary' in rec
    assert rec['evidence_summary']['findings_count'] >= 1
    assert 'Reroute to Tacoma' in rec['evidence_summary']['top_actions']
