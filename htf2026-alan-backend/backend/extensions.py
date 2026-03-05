"""
Shared Flask extensions — importable by route modules without circular imports.
"""

from __future__ import annotations

import os

from flask_limiter import Limiter
from flask_limiter.util import get_remote_address


# ── Rate Limiter ──────────────────────────────────────────────────────────
# Uses in-memory storage for dev; set RATELIMIT_STORAGE_URI for Redis in prod.
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["60/minute"],
    storage_uri=os.getenv("RATELIMIT_STORAGE_URI", "memory://"),
)
