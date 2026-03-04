# HarborGuard AI — Maritime Supply Chain Risk Platform

**htf2026-alan-backend** — Full-stack risk intelligence platform for maritime logistics disruptions.

## Architecture

```
htf2026-alan-backend/
├── backend/              # Flask API server
│   ├── app.py            # Application factory + security layer
│   ├── extensions.py     # Shared Flask extensions (rate limiter)
│   ├── models.py         # SQLAlchemy models (14 tables)
│   ├── routes/           # API blueprints (10 modules)
│   ├── services/         # Business logic (12 modules)
│   ├── fixtures/         # Seed data (JSON)
│   ├── static/           # Dashboard HTML
│   ├── jobs.py           # APScheduler background tasks
│   └── tests/            # pytest suite
└── frontend/             # React/TypeScript components
    └── src/
        ├── pages/        # LandingPage
        ├── components/   # Globe, LiveSignals, KeywordMonitor
        └── hooks/        # Scroll animations
```

## Quick Start

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python seed.py
BOOTSTRAP_LIVE_ON_START=false python app.py
```

Open **http://localhost:5001/** for the visual dashboard.

## API Documentation

Swagger UI: http://localhost:5001/swagger-ui (disabled in production)

### Key Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/events` | Risk events (NEWS/WEATHER) |
| GET | `/api/stream/events` | SSE live event stream |
| GET | `/api/signals` | Live RSS maritime signals |
| POST | `/api/signals/detect` | LLM news classification |
| GET | `/api/dashboard` | Aggregated dashboard data |
| POST | `/api/disruptions` | Create disruption |
| GET | `/api/disruptions/{id}/exposure` | Financial exposure analysis |
| GET | `/api/disruptions/{id}/strategies` | Strategy comparison |
| GET | `/api/disruptions/{id}/recommendation` | AI recommendation + LLM drafts |
| POST | `/api/recommendations/generate` | Risk-aware recommendations |

## Security

All endpoints are protected with:
- **Rate limiting** via flask-limiter (per-route limits, LLM endpoints capped at 3-5/min)
- **CORS** via flask-cors (localhost-only by default)
- **Security headers**: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, HSTS
- **Input validation**: Marshmallow schemas, request size cap (1 MB), LLM input caps
- **Error sanitization**: No stack traces leak to clients

## Environment Variables

```bash
# Required for LLM features
GOOGLE_API_KEY=<your-key>

# Security (auto-generated if not set)
SECRET_KEY=<64-char-hex>

# Production
FLASK_ENV=production
CORS_ORIGINS=https://yourdomain.com
RATELIMIT_STORAGE_URI=redis://localhost:6379/0
HOST=0.0.0.0

# Data sources
GDELT_MAIN_QUERY="port strike Asia"
RSS_FALLBACK_ENABLED=true
BOOTSTRAP_LIVE_ON_START=true
```

## Testing

```bash
cd backend && pytest -q
```

## License

HTF 2026 — Team Alan
