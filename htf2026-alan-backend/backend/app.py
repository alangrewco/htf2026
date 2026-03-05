from __future__ import annotations

import os
import secrets
from typing import Iterable

from flask import Flask, jsonify
from flask_cors import CORS
from flask_smorest import Api
from dotenv import load_dotenv
from werkzeug.exceptions import HTTPException

from extensions import limiter

from jobs import DEMO_WAYPOINTS, init_scheduler, run_gdelt_cycle
from models import (
    Recommendation,
    RecommendationFeedback,
    ResearchFinding,
    ResearchTask,
    RiskEvent,
    db,
)
from routes.dashboard import blp as dashboard_blp
from routes.disruptions import blp as disruptions_blp
from routes.signals import blp as signals_blp
from routes.events import blp as events_blp
from routes.health import blp as health_blp
from routes.preferences import blp as preferences_blp
from routes.recommendations import blp as recommendations_blp
from routes.research import blp as research_blp
from routes.shipments import blp as shipments_blp
from routes.stream import blp as stream_blp
from services.ingestion_gdelt import DEFAULT_QUERY
from services.ingestion_rss import DEFAULT_RSS_FEEDS, poll_rss
from services.ingestion_weather import poll_weather


load_dotenv()



def _split_csv(value: str | None, default: Iterable[str]) -> list[str]:
    if not value:
        return list(default)
    values = [part.strip() for part in value.split(",")]
    return [part for part in values if part]


def should_run_bootstrap(app: Flask) -> bool:
    if app.config.get("TESTING", False):
        return False
    if not app.config.get("BOOTSTRAP_LIVE_ON_START", True):
        return False

    # In debug mode, Flask reloader starts parent+child process.
    # Run bootstrap only in the reloader child process to avoid duplicate API calls.
    if app.debug and os.getenv("WERKZEUG_RUN_MAIN") != "true":
        return False
    return True


def bootstrap_live_data_on_start() -> None:
    # Keep static fixtures intact; reset dynamic/live tables for clean startup state.
    db.session.query(ResearchFinding).delete()
    db.session.query(ResearchTask).delete()
    db.session.query(RecommendationFeedback).delete()
    db.session.query(Recommendation).delete()
    db.session.query(RiskEvent).delete()
    db.session.commit()

    weather_created = 0
    news_created = 0
    weather_error = None
    news_error = None

    try:
        weather_created = poll_weather(DEMO_WAYPOINTS, forecast_days=7)
    except Exception as exc:
        weather_error = str(exc)

    seed_source = "gdelt"
    gdelt_query = os.getenv("GDELT_MAIN_QUERY", os.getenv("GDELT_STARTUP_QUERY", DEFAULT_QUERY))
    gdelt_max_records = int(
        os.getenv("GDELT_MAIN_MAX_RECORDS", os.getenv("GDELT_STARTUP_MAX_RECORDS", "50"))
    )
    gdelt_timeout_seconds = int(os.getenv("GDELT_READ_TIMEOUT_SECONDS", "300"))
    gdelt_followup_query = os.getenv(
        "GDELT_FOLLOWUP_QUERY",
        "maritime OR shipping OR port congestion OR logistics disruption",
    )
    gdelt_followup_max_records = int(os.getenv("GDELT_FOLLOWUP_MAX_RECORDS", "25"))
    gdelt_followup_delay_seconds = int(os.getenv("GDELT_FOLLOWUP_DELAY_SECONDS", "10"))
    rss_enabled = os.getenv("RSS_FALLBACK_ENABLED", "true").lower() == "true"
    rss_feeds = _split_csv(os.getenv("RSS_FEEDS"), DEFAULT_RSS_FEEDS)
    print(
        "gdelt_seed_config: "
        f"query={gdelt_query} maxrecords={gdelt_max_records} timeout_s={gdelt_timeout_seconds} "
        f"followup_query={gdelt_followup_query} followup_maxrecords={gdelt_followup_max_records} "
        f"followup_delay_s={gdelt_followup_delay_seconds}"
    )

    gdelt_result = run_gdelt_cycle(startup=True)
    news_created = gdelt_result["total_created"]
    news_error = gdelt_result.get("error")
    # Only fallback when GDELT produced no rows. A follow-up stage error after a successful
    # main stage should not discard successful GDELT seeding.
    if news_error and news_created == 0:
        if rss_enabled:
            try:
                news_created = poll_rss(feeds=rss_feeds, max_items_per_feed=25)
                seed_source = "rss"
            except Exception as rss_exc:
                news_error = f"{news_error}; rss_fallback_error={rss_exc}"

    total = weather_created + news_created
    print(
        f"seeding complete: weather_created={weather_created} news_created={news_created} total={total} source={seed_source}"
    )
    if weather_error:
        print(f"weather_seed_error={weather_error}")
    if news_error:
        print(f"news_seed_error={news_error}")


def create_app(test_config: dict | None = None) -> Flask:
    app = Flask(__name__, static_folder="static", static_url_path="/static")

    # ── Security: SECRET_KEY ──────────────────────────────────────────────
    # Required for session signing and CSRF protection.
    # Generate a random key if not provided (safe for dev, must be set for prod).
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", secrets.token_hex(32))

    # ── Security: Max request body size (1 MB) ────────────────────────────
    app.config["MAX_CONTENT_LENGTH"] = int(os.getenv("MAX_CONTENT_LENGTH", str(1 * 1024 * 1024)))

    app.config.update(
        API_TITLE="Maritime Risk Feed API",
        API_VERSION="v1",
        OPENAPI_VERSION="3.0.3",
        OPENAPI_URL_PREFIX="/",
        OPENAPI_JSON_PATH="swagger.json",
        # Conditionally expose Swagger UI only in non-production
        OPENAPI_SWAGGER_UI_PATH=(
            "swagger-ui" if os.getenv("FLASK_ENV") != "production" else None
        ),
        OPENAPI_SWAGGER_UI_URL=(
            "https://cdn.jsdelivr.net/npm/swagger-ui-dist/"
            if os.getenv("FLASK_ENV") != "production"
            else None
        ),
        OPENAPI_REDOC_PATH=None,
        OPENAPI_REDOC_URL=None,
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        SQLALCHEMY_DATABASE_URI=os.getenv("DATABASE_URL", "sqlite:///backend.db"),
        ENABLE_SCHEDULER=True,
        BOOTSTRAP_LIVE_ON_START=os.getenv("BOOTSTRAP_LIVE_ON_START", "true").lower() == "true",
    )

    if test_config:
        app.config.update(test_config)

    # ── Security: CORS ────────────────────────────────────────────────────
    # Restrict origins in production. In dev, allow localhost origins.
    allowed_origins = _split_csv(
        os.getenv("CORS_ORIGINS"),
        ["http://localhost:*", "http://127.0.0.1:*"],
    )
    CORS(app, origins=allowed_origins, supports_credentials=False)

    # ── Security: Rate Limiting ───────────────────────────────────────────
    limiter.init_app(app)

    db.init_app(app)
    api = Api(app)

    api.register_blueprint(health_blp)
    api.register_blueprint(events_blp)
    api.register_blueprint(stream_blp)
    api.register_blueprint(shipments_blp)
    api.register_blueprint(recommendations_blp)
    api.register_blueprint(preferences_blp)
    api.register_blueprint(research_blp)
    api.register_blueprint(disruptions_blp)
    api.register_blueprint(dashboard_blp)
    api.register_blueprint(signals_blp)

    # ── Security: Response Headers ────────────────────────────────────────
    @app.after_request
    def set_security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        # Add HSTS in production (behind TLS terminator)
        if os.getenv("FLASK_ENV") == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

    # ── Security: Sanitize Error Responses ────────────────────────────────
    # Prevent stack traces and internal details from leaking to clients.
    @app.errorhandler(HTTPException)
    def handle_http_exception(exc):
        return jsonify({"error": exc.name, "message": exc.description}), exc.code

    @app.errorhandler(429)
    def handle_rate_limit(exc):
        return jsonify({
            "error": "Too Many Requests",
            "message": "Rate limit exceeded. Please slow down.",
        }), 429

    @app.errorhandler(413)
    def handle_too_large(exc):
        return jsonify({
            "error": "Payload Too Large",
            "message": "Request body exceeds the 1 MB limit.",
        }), 413

    @app.errorhandler(Exception)
    def handle_unexpected_error(exc):
        # Log full error server-side but return generic message to client
        app.logger.exception("Unhandled exception: %s", exc)
        return jsonify({
            "error": "Internal Server Error",
            "message": "An unexpected error occurred.",
        }), 500

    with app.app_context():
        db.create_all()
        if should_run_bootstrap(app):
            bootstrap_live_data_on_start()

    if app.config.get("ENABLE_SCHEDULER", True):
        init_scheduler(app)

    # Serve the visual dashboard at root
    @app.route("/")
    def dashboard_index():
        return app.send_static_file("index.html")

    return app


if __name__ == "__main__":
    flask_app = create_app()
    flask_app.run(
        host=os.getenv("HOST", "127.0.0.1"),
        port=int(os.getenv("PORT", "5001")),
        debug=os.getenv("FLASK_ENV") != "production",
        use_reloader=False,
    )
