import requests

import jobs


def test_run_gdelt_cycle_uses_main_and_followup_queries(monkeypatch):
    calls = []

    monkeypatch.setenv("GDELT_MAIN_QUERY", "port strike Asia")
    monkeypatch.setenv("GDELT_FOLLOWUP_QUERY", "maritime OR shipping OR logistics")
    monkeypatch.setenv("GDELT_MAIN_MAX_RECORDS", "50")
    monkeypatch.setenv("GDELT_FOLLOWUP_MAX_RECORDS", "25")
    monkeypatch.setenv("GDELT_READ_TIMEOUT_SECONDS", "300")
    monkeypatch.setenv("GDELT_FOLLOWUP_DELAY_SECONDS", "0")

    jobs._gdelt_cooldown_until = None

    def fake_poll_gdelt(*, queries, max_records, timeout_seconds):
        calls.append((queries[0], max_records, timeout_seconds))
        return 1

    monkeypatch.setattr("jobs.poll_gdelt", fake_poll_gdelt)

    result = jobs.run_gdelt_cycle(startup=False)

    assert result["created_main"] == 1
    assert result["created_followup"] == 1
    assert result["total_created"] == 2
    assert result["error"] is None
    assert calls == [
        ("port strike Asia", 50, 300),
        ("maritime OR shipping OR logistics", 25, 300),
    ]


def test_run_gdelt_cycle_sets_cooldown_on_429(monkeypatch):
    monkeypatch.setenv("GDELT_FOLLOWUP_DELAY_SECONDS", "0")
    monkeypatch.setenv("GDELT_429_COOLDOWN_SECONDS", "900")

    jobs._gdelt_cooldown_until = None

    def fake_poll_gdelt(*, queries, max_records, timeout_seconds):
        resp = requests.Response()
        resp.status_code = 429
        err = requests.exceptions.HTTPError("429 Too Many Requests")
        err.response = resp
        raise err

    monkeypatch.setattr("jobs.poll_gdelt", fake_poll_gdelt)

    result = jobs.run_gdelt_cycle(startup=False)
    assert result["error"] is not None
    assert jobs._gdelt_cooldown_until is not None


def test_poll_gdelt_job_respects_cooldown(monkeypatch):
    monkeypatch.setenv("GDELT_429_COOLDOWN_SECONDS", "900")
    jobs._gdelt_cooldown_until = jobs.datetime.utcnow().replace(year=2099)

    called = {"poll": 0}

    def fake_poll_gdelt(*, queries, max_records, timeout_seconds):
        called["poll"] += 1
        return 1

    monkeypatch.setattr("jobs.poll_gdelt", fake_poll_gdelt)

    created = jobs.poll_gdelt_job()
    assert created == 0
    assert called["poll"] == 0
