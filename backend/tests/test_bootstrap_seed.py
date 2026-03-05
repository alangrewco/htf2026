from app import create_app


def test_bootstrap_uses_rss_fallback_on_gdelt_error(monkeypatch):
    calls = {"weather": 0, "gdelt_cycle": 0, "rss": 0}

    monkeypatch.setenv("RSS_FALLBACK_ENABLED", "true")

    def fake_weather(*args, **kwargs):
        calls["weather"] += 1
        return 0

    def fake_gdelt_cycle(*args, **kwargs):
        calls["gdelt_cycle"] += 1
        return {
            "created_main": 0,
            "created_followup": 0,
            "total_created": 0,
            "error": "429",
        }

    def fake_rss(*args, **kwargs):
        calls["rss"] += 1
        return 2

    monkeypatch.setattr("app.poll_weather", fake_weather)
    monkeypatch.setattr("app.run_gdelt_cycle", fake_gdelt_cycle)
    monkeypatch.setattr("app.poll_rss", fake_rss)

    create_app(
        {
            "TESTING": False,
            "ENABLE_SCHEDULER": False,
            "BOOTSTRAP_LIVE_ON_START": True,
            "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        }
    )

    assert calls["weather"] == 1
    assert calls["gdelt_cycle"] == 1
    assert calls["rss"] == 1


def test_bootstrap_skips_rss_when_gdelt_succeeds(monkeypatch):
    calls = {"gdelt_cycle": 0, "rss": 0}

    monkeypatch.setenv("RSS_FALLBACK_ENABLED", "true")

    def fake_weather(*args, **kwargs):
        return 0

    def fake_gdelt_cycle(*args, **kwargs):
        calls["gdelt_cycle"] += 1
        return {
            "created_main": 2,
            "created_followup": 1,
            "total_created": 3,
            "error": None,
        }

    def fake_rss(*args, **kwargs):
        calls["rss"] += 1
        return 0

    monkeypatch.setattr("app.poll_weather", fake_weather)
    monkeypatch.setattr("app.run_gdelt_cycle", fake_gdelt_cycle)
    monkeypatch.setattr("app.poll_rss", fake_rss)

    create_app(
        {
            "TESTING": False,
            "ENABLE_SCHEDULER": False,
            "BOOTSTRAP_LIVE_ON_START": True,
            "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        }
    )

    assert calls["gdelt_cycle"] == 1
    assert calls["rss"] == 0


def test_bootstrap_skips_rss_when_gdelt_has_partial_success(monkeypatch):
    calls = {"gdelt_cycle": 0, "rss": 0}

    monkeypatch.setenv("RSS_FALLBACK_ENABLED", "true")

    def fake_weather(*args, **kwargs):
        return 0

    def fake_gdelt_cycle(*args, **kwargs):
        calls["gdelt_cycle"] += 1
        return {
            "created_main": 10,
            "created_followup": 0,
            "total_created": 10,
            "error": "followup parse error",
        }

    def fake_rss(*args, **kwargs):
        calls["rss"] += 1
        return 0

    monkeypatch.setattr("app.poll_weather", fake_weather)
    monkeypatch.setattr("app.run_gdelt_cycle", fake_gdelt_cycle)
    monkeypatch.setattr("app.poll_rss", fake_rss)

    create_app(
        {
            "TESTING": False,
            "ENABLE_SCHEDULER": False,
            "BOOTSTRAP_LIVE_ON_START": True,
            "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        }
    )

    assert calls["gdelt_cycle"] == 1
    assert calls["rss"] == 0
