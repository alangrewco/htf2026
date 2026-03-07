import json
from urllib import request


DEFAULT_TIMEOUT_SEC = 20


def get_json(url: str, headers: dict[str, str] | None = None) -> dict:
    req = request.Request(url, headers=headers or {})
    with request.urlopen(req, timeout=DEFAULT_TIMEOUT_SEC) as response:
        raw = response.read().decode("utf-8", errors="replace")
    return json.loads(raw)


def get_text(url: str, headers: dict[str, str] | None = None) -> str:
    req = request.Request(url, headers=headers or {})
    with request.urlopen(req, timeout=DEFAULT_TIMEOUT_SEC) as response:
        return response.read().decode("utf-8", errors="replace")
