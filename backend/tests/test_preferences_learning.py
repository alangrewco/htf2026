def test_preference_learning_changes_weights(client):
    generate = client.post(
        '/api/recommendations/generate',
        json={'profile': 'resilient', 'sku_ids': [1], 'horizon_days': 30},
    )
    assert generate.status_code == 200
    first = generate.get_json()
    rec_id = first['recommendations'][0]['id']
    w_cost_before = first['weights']['w_cost']

    feedback = client.post(
        f'/api/recommendations/{rec_id}/feedback',
        json={'accepted': False, 'reason_code': 'too_expensive'},
    )
    assert feedback.status_code == 200

    prefs = client.get('/api/preferences').get_json()
    assert abs((prefs['w_cost'] + prefs['w_speed'] + prefs['w_risk']) - 1.0) < 1e-6

    second = client.post(
        '/api/recommendations/generate',
        json={'profile': 'resilient', 'sku_ids': [1], 'horizon_days': 30},
    ).get_json()
    assert second['weights']['w_cost'] > w_cost_before
