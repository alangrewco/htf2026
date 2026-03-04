from datetime import datetime

from jobs import process_research_tasks
from models import ResearchFinding, ResearchTask, RiskEvent, db


def test_research_task_processing(client, app, monkeypatch):
    with app.app_context():
        event = RiskEvent(
            event_type='NEWS',
            title='Election risk',
            summary='Possible disruption',
            severity=50,
            confidence=0.5,
            source='gdelt',
            source_url='https://example.com/election',
            published_at=datetime(2026, 3, 3),
            impacted_ports=[],
            impacted_countries=[],
            impacted_keywords=['election'],
            dedupe_key='research-event-1',
            metadata_json={},
        )
        db.session.add(event)
        db.session.commit()

    task_resp = client.post('/api/research/tasks', json={'event_id': 1, 'mode': 'enrich'})
    assert task_resp.status_code == 201

    fixed = {
        'event_type': 'NEWS',
        'title': 'Election risk enriched',
        'summary': 'Enriched summary',
        'severity': 72,
        'confidence': 0.84,
        'impacted': {'ports': ['USLAX'], 'countries': ['US'], 'keywords': ['election', 'port']},
        'time_window': {'start': '2026-03-03T00:00:00', 'end': '2026-03-10T00:00:00'},
        'recommended_actions': [{'action': 'Shift shipment', 'rationale': 'Avoid risk'}],
        'citations': [{'url': 'https://example.com/election', 'note': 'source'}],
    }

    def fake_enrich(url, title, snippet):
        return fixed

    monkeypatch.setattr('jobs.enrich_news_event', fake_enrich)

    with app.app_context():
        processed = process_research_tasks()
        assert processed == 1
        finding = ResearchFinding.query.first()
        assert finding is not None
        assert finding.finding_json['severity'] == 72
        event = RiskEvent.query.get(1)
        assert event.severity == 72
        assert event.impacted_ports == ['USLAX']
        task = ResearchTask.query.first()
        assert task.status == 'done'


def test_research_task_processing_normalizes_llm_shapes(client, app, monkeypatch):
    with app.app_context():
        event = RiskEvent(
            event_type='NEWS',
            title='Port delay advisory',
            summary='Unexpected berth delays',
            severity=50,
            confidence=0.5,
            source='gdelt',
            source_url='https://example.com/delay',
            published_at=datetime(2026, 3, 3),
            impacted_ports=[],
            impacted_countries=[],
            impacted_keywords=['delay'],
            dedupe_key='research-event-2',
            metadata_json={},
        )
        db.session.add(event)
        db.session.commit()

    task_resp = client.post('/api/research/tasks', json={'event_id': 1, 'mode': 'enrich'})
    assert task_resp.status_code == 201

    non_strict = {
        'event_type': 'NEWS',
        'title': 'Port delay advisory',
        'summary': 'Model returned symbolic fields',
        'severity': 'Negligible',
        'confidence': 'high',
        'impacted': [],
        'time_window': None,
        'recommended_actions': [],
        'citations': ['https://example.com/delay'],
    }

    monkeypatch.setattr('jobs.enrich_news_event', lambda **_: non_strict)

    with app.app_context():
        processed = process_research_tasks()
        assert processed == 1
        event = RiskEvent.query.get(1)
        assert event.severity == 10
        assert event.confidence == 0.5
        assert event.impacted_ports == []
        task = ResearchTask.query.first()
        assert task.status == 'done'
        finding = ResearchFinding.query.first()
        assert finding is not None


def test_research_task_processing_respects_batch_loops(client, app, monkeypatch):
    with app.app_context():
        for idx in range(1, 7):
            event = RiskEvent(
                event_type='NEWS',
                title=f'Batch event {idx}',
                summary='batch test',
                severity=50,
                confidence=0.5,
                source='gdelt',
                source_url=f'https://example.com/batch-{idx}',
                published_at=datetime(2026, 3, 3),
                impacted_ports=[],
                impacted_countries=[],
                impacted_keywords=['batch'],
                dedupe_key=f'research-batch-{idx}',
                metadata_json={},
            )
            db.session.add(event)
        db.session.commit()

    for event_id in range(1, 7):
        task_resp = client.post('/api/research/tasks', json={'event_id': event_id, 'mode': 'enrich'})
        assert task_resp.status_code == 201

    fixed = {
        'event_type': 'NEWS',
        'title': 'Batch enriched',
        'summary': 'batch enriched summary',
        'severity': 62,
        'confidence': 0.7,
        'impacted': {'ports': ['USLAX'], 'countries': ['US'], 'keywords': ['batch']},
        'time_window': {'start': '2026-03-03T00:00:00', 'end': '2026-03-10T00:00:00'},
        'recommended_actions': [{'action': 'Hold', 'rationale': 'Batch test'}],
        'citations': [{'url': 'https://example.com', 'note': 'source'}],
    }
    monkeypatch.setattr('jobs.enrich_news_event', lambda **_: fixed)
    monkeypatch.setenv('ENRICHMENT_MAX_WORKERS', '4')
    monkeypatch.setenv('ENRICHMENT_BATCH_SIZE', '2')
    monkeypatch.setenv('ENRICHMENT_MAX_BATCH_LOOPS', '2')

    with app.app_context():
        processed = process_research_tasks()
        assert processed == 4
        queued = ResearchTask.query.filter_by(status='queued').count()
        done = ResearchTask.query.filter_by(status='done').count()
        assert done == 4
        assert queued == 2


def test_research_task_trace_endpoint_returns_stage_meta(client, app, monkeypatch):
    with app.app_context():
        event = RiskEvent(
            event_type='NEWS',
            title='Trace test event',
            summary='Trace summary',
            severity=50,
            confidence=0.5,
            source='gdelt',
            source_url='https://example.com/trace',
            published_at=datetime(2026, 3, 3),
            impacted_ports=[],
            impacted_countries=[],
            impacted_keywords=['trace'],
            dedupe_key='research-trace-1',
            metadata_json={},
        )
        db.session.add(event)
        db.session.commit()

    task_resp = client.post('/api/research/tasks', json={'event_id': 1, 'mode': 'enrich'})
    assert task_resp.status_code == 201
    task_id = task_resp.get_json()['id']

    fixed = {
        'event_type': 'NEWS',
        'title': 'Trace enriched',
        'summary': 'Trace summary enriched',
        'severity': 64,
        'confidence': 0.77,
        'impacted': {'ports': ['USLAX'], 'countries': ['US'], 'keywords': ['trace']},
        'time_window': {'start': '2026-03-03T00:00:00', 'end': '2026-03-10T00:00:00'},
        'recommended_actions': [{'action': 'Shift lane', 'rationale': 'Trace test'}],
        'citations': [{'url': 'https://example.com/trace', 'note': 'source'}],
        '_meta': {
            'agent_path': 'relevance->impact->action',
            'stage_status': {'relevance': 'ok', 'impact': 'ok', 'action': 'ok'},
            'enrichment_source': 'adk',
            'latency_ms_total': 123,
            'latency_ms_by_agent': {'relevance': 10, 'impact': 40, 'action': 73},
            'stage_outputs': {
                'relevance_raw': {'is_relevant': True, 'relevance_score': 0.91, 'reason': 'Maritime operations impact'},
                'impact_raw': {'severity': 64, 'impacted': {'ports': ['USLAX']}},
                'action_raw': {'recommended_actions': [{'action': 'Shift lane', 'rationale': 'Trace test'}]},
            },
            'is_relevant': True,
            'relevance_score': 0.91,
            'relevance_reason': 'Maritime operations impact',
        },
    }
    monkeypatch.setattr('jobs.enrich_news_event', lambda **_: fixed)

    with app.app_context():
        processed = process_research_tasks()
        assert processed == 1

    trace_resp = client.get(f'/api/research/tasks/{task_id}/trace')
    assert trace_resp.status_code == 200
    trace = trace_resp.get_json()
    assert trace['task_id'] == task_id
    assert trace['agent_path'] == 'relevance->impact->action'
    assert trace['stage_status']['relevance'] == 'ok'
    assert trace['stage_outputs']['relevance_raw']['is_relevant'] is True
    assert trace['relevance']['is_relevant'] is True
    assert trace['enrichment_source'] == 'adk'
