def test_swagger_ui(client):
    resp = client.get('/swagger-ui')
    assert resp.status_code == 200


def test_openapi_and_redoc_disabled(client):
    assert client.get('/openapi.json').status_code == 404
    assert client.get('/redoc').status_code == 404
