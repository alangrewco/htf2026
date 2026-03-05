from services.ingestion_gdelt import poll_gdelt
from services.ingestion_rss import poll_rss
from services.ingestion_weather import poll_weather


def test_poll_weather_mocked(requests_mock, app):
    requests_mock.get(
        'https://marine-api.open-meteo.com/v1/marine',
        json={'hourly': {'wave_height': [3.5], 'wind_speed_10m': [45]}},
    )
    with app.app_context():
        created = poll_weather([{'code': 'USLAX', 'country': 'US', 'lat': 33.7, 'lon': -118.2}])
        assert created == 1


def test_poll_gdelt_mocked(requests_mock, app):
    requests_mock.get(
        'https://api.gdeltproject.org/api/v2/doc/doc',
        json={
            'articles': [
                {
                    'url': 'https://example.com/news/1',
                    'seendate': '20260303T010000Z',
                    'title': 'Port strike update',
                }
            ]
        },
    )
    with app.app_context():
        created = poll_gdelt(queries=['port strike'], max_records=1)
        assert created == 1


def test_poll_gdelt_dedupes_on_title(requests_mock, app):
    requests_mock.get(
        'https://api.gdeltproject.org/api/v2/doc/doc',
        json={
            'articles': [
                {
                    'url': 'https://example.com/news/one',
                    'seendate': '20260303T010000Z',
                    'title': 'Major port strike disrupts route',
                },
                {
                    'url': 'https://example.com/news/two',
                    'seendate': '20260303T020000Z',
                    'title': 'Major port strike disrupts route',
                },
            ]
        },
    )
    with app.app_context():
        created = poll_gdelt(queries=['port strike'], max_records=2)
        assert created == 1


def test_poll_gdelt_default_single_request(requests_mock, app):
    requests_mock.get(
        'https://api.gdeltproject.org/api/v2/doc/doc',
        json={'articles': []},
    )
    with app.app_context():
        created = poll_gdelt(max_records=1)
        assert created == 0
    assert requests_mock.call_count == 1


def test_poll_gdelt_passes_timeout(monkeypatch, app):
    captured = {}

    class DummyResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return {"articles": []}

    def fake_get(url, params=None, timeout=None, headers=None, **kwargs):
        captured["url"] = url
        captured["params"] = params
        captured["timeout"] = timeout
        captured["headers"] = headers
        return DummyResponse()

    monkeypatch.setattr("services.ingestion_gdelt.requests.get", fake_get)

    with app.app_context():
        created = poll_gdelt(queries=["port strike"], max_records=7, timeout_seconds=300)
        assert created == 0

    assert captured["timeout"] == 300
    assert captured["params"]["maxrecords"] == 7
    assert "User-Agent" in captured["headers"]


def test_poll_rss_skips_forbidden_feed(requests_mock, app):
    requests_mock.get("https://bad-feed.example/rss", status_code=403)
    requests_mock.get(
        "https://good-feed.example/rss",
        text=(
            "<rss><channel><item>"
            "<title>Port congestion</title>"
            "<link>https://example.com/news/ok</link>"
            "<pubDate>Tue, 03 Mar 2026 10:00:00 GMT</pubDate>"
            "<description>Congestion update.</description>"
            "</item></channel></rss>"
        ),
    )
    with app.app_context():
        created = poll_rss(
            feeds=["https://bad-feed.example/rss", "https://good-feed.example/rss"],
            max_items_per_feed=5,
        )
        assert created == 1
