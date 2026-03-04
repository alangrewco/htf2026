from models import RiskEvent


def test_admin_endpoints_require_flag(client, app):
    app.config["ENABLE_ADMIN_API"] = False
    resp = client.post("/api/admin/ingestion/poll", json={"weather": False, "news": False})
    assert resp.status_code == 404


def test_admin_ingestion_poll_success(client, app, monkeypatch):
    app.config["ENABLE_ADMIN_API"] = True

    monkeypatch.setattr("routes.admin.poll_weather", lambda *args, **kwargs: 2)

    def _fake_gdelt(*args, **kwargs):
        return 5

    monkeypatch.setattr("routes.admin.poll_gdelt", _fake_gdelt)

    resp = client.post(
        "/api/admin/ingestion/poll",
        json={"weather": True, "news": True, "news_target_count": 5, "include_followup": False},
    )
    assert resp.status_code == 200
    payload = resp.get_json()
    assert payload["weather_created"] == 2
    assert payload["news_created"] == 5
    assert payload["total_created"] == 7
    assert payload["source"] == "live"


def test_admin_mock_news_insert_and_dedupe(client, app):
    app.config["ENABLE_ADMIN_API"] = True
    body = {
        "articles": [
            {
                "title": "Port labor strike watch at LA terminal",
                "summary": "Unions announced an escalation window for labor actions.",
                "source_url": "https://example.com/mock/1",
                "severity": 65,
                "impacted_ports": ["USLAX"],
                "impacted_countries": ["US"],
                "impacted_keywords": ["labor", "strike"],
            },
            {
                "title": "Port labor strike watch at LA terminal",
                "summary": "Duplicate title should dedupe.",
                "source_url": "https://example.com/mock/1-dup",
                "severity": 65,
                "impacted_ports": ["USLAX"],
                "impacted_countries": ["US"],
                "impacted_keywords": ["labor", "strike"],
            },
        ]
    }

    resp = client.post("/api/admin/events/mock-news", json=body)
    assert resp.status_code == 200
    payload = resp.get_json()
    assert payload["created_count"] == 1
    assert payload["skipped_duplicates"] == 1
    assert len(payload["created_event_ids"]) == 1

    with app.app_context():
        assert RiskEvent.query.filter_by(source="mock").count() == 1


def test_admin_default_mock_set(client, app):
    app.config["ENABLE_ADMIN_API"] = True
    first = client.post("/api/admin/events/mock-news/default-set", json={})
    assert first.status_code == 200
    first_payload = first.get_json()
    assert first_payload["pack_name"] == "asia_us_disruptions_v1"
    assert first_payload["created_count"] > 0
    assert len(first_payload["created_event_ids"]) == first_payload["created_count"]

    second = client.post("/api/admin/events/mock-news/default-set", json={})
    assert second.status_code == 200
    second_payload = second.get_json()
    assert second_payload["created_count"] == 0
    assert second_payload["skipped_duplicates"] >= 1
