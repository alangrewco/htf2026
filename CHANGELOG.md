# CHANGELOG — htf2026-alan-backend

All changes made since the original alan-backend codebase.

---

## Phase 1: HTF_Hackathonb Port

Ported backend services, routes, models, and fixtures from the HTF_Hackathonb project (FastAPI/Pydantic/UUID). All code was refactored to match the existing Flask/Marshmallow/integer-PK architecture.

### New Backend Services (4 files)

| File | Purpose |
|---|---|
| `services/exposure.py` | Newsvendor safety stock model, criticality-weighted risk scoring (CriticalityScore^λ), service risk grades (A–F), inventory runway + stockout date projection |
| `services/optimizer.py` | Risk DNA weighted strategy evaluation (α·R − β·C − δ·P), working capital feasibility constraint, SLA penalty calculation. Simplified from TOPSIS+MILP to pure enumeration to avoid PuLP/NumPy deps |
| `services/llm_generator.py` | Gemini-based communication draft generation via google-adk: supplier emails, logistics requests, executive summaries. Falls back to templates when API key is absent |
| `services/perception.py` | LLM-based news classification (disruption detection with severity, port, and confidence parsing). Falls back to keyword-based classification |

### New Backend Routes (2 files)

| File | Endpoints |
|---|---|
| `routes/disruptions.py` | `GET/POST /api/disruptions`, `GET .../exposure`, `GET .../strategies`, `GET .../recommendation`, `POST .../resolve` |
| `routes/dashboard.py` | `GET /api/dashboard` — aggregated company profile, active disruptions, revenue-at-risk metrics, latest recommendation |

### New Models (4 added to `models.py`)

| Model | Table | Purpose |
|---|---|---|
| `Company` | `companies` | Single-tenant company profile with Risk DNA parameters |
| `Disruption` | `disruptions` | Port disruption events driving the pipeline |
| `Strategy` | `strategies` | Predefined mitigation strategy templates (S1–S4) |
| `MitigationRecommendation` | `mitigation_recommendations` | Final recommendation with LLM-generated drafts and approval workflow |

### New Fixtures (2 files)

| File | Contents |
|---|---|
| `fixtures/company.json` | Apex Electronics demo profile (revenue, margins, risk DNA parameters) |
| `fixtures/strategies.json` | 4 mitigation strategies: Emergency Air, Reroute Priority, Buffer Stock, Balanced Hybrid |

### Modified Existing Files

| File | Change |
|---|---|
| `app.py` | Imported and registered `disruptions_blp`, `dashboard_blp` |
| `seed.py` | Added Company and Strategy model imports and fixture seeding |

### Frontend (3 files, all new)

| File | Purpose |
|---|---|
| `frontend/src/pages/LandingPage.tsx` | Full editorial-style dark-theme landing page |
| `frontend/src/components/SupplyChainGlobe.tsx` | Canvas 3D globe with animated trade route arcs |
| `frontend/src/hooks/useScrollAnimations.ts` | Scroll reveal, count-up, parallax hooks |

---

## Phase 2: WorldMonitor Integration

Added three real-time monitoring features from the WorldMonitor project.

### New Backend Route (1 file)

| File | Endpoints | Description |
|---|---|---|
| `routes/signals.py` | `GET /api/signals`, `POST /api/signals/detect` | RSS proxy for 5 maritime/logistics feeds with word-boundary keyword filtering + LLM-based news classification |

### New Frontend Components (2 files)

| File | Description |
|---|---|
| `frontend/src/components/LiveSignalsPanel.tsx` | Real-time RSS feed panel with auto-refresh (60s), keyword match highlighting, source/time metadata |
| `frontend/src/components/KeywordMonitor.tsx` | "Risk Radar" keyword input/tag UI with comma-separated batch input and color-coded tags |

### Modified Existing Files

| File | Change |
|---|---|
| `app.py` | Imported and registered `signals_blp` |

---

## Phase 3: Refactoring Audit

Audited all ported files for import correctness and pattern consistency.

| File | Issue | Fix |
|---|---|---|
| `services/exposure.py` | Unused imports: `Company`, `Port` | Removed |
| `services/optimizer.py` | Unused import: `db` | Removed |
| `routes/signals.py` | Unused import: `datetime` | Removed |
| `routes/disruptions.py` | `.get()` with redundant defaults on Marshmallow `load_default` fields | Changed to direct `[]` access |

---

## Phase 4: Visual Dashboard

Created a self-contained HTML dashboard served by Flask at the root URL.

### New Files

| File | Description |
|---|---|
| `backend/static/index.html` | Full dark-theme dashboard with KPI metric cards, tabbed disruption/exposure/strategy/recommendation views, live signals sidebar, and keyword monitor. No build step needed — plain HTML/CSS/JS |

### Modified Existing Files

| File | Change |
|---|---|
| `app.py` | Added `static_folder="static"` to Flask constructor and root `/` route |

---

## Phase 5: Security Hardening

Full security audit identified 12 vulnerabilities. All fixed.

### New Files

| File | Description |
|---|---|
| `backend/extensions.py` | Shared Flask extensions module containing the rate limiter singleton (avoids circular imports between `app.py` and route modules) |

### Modified: `app.py` (major changes)

| Safeguard | Detail |
|---|---|
| SECRET_KEY | Auto-generated 64-char hex or loaded from `SECRET_KEY` env var |
| CORS | flask-cors with restrictive origin policy (default: localhost only) |
| Rate limiting | flask-limiter initialized with 60/min default (memory backend, Redis-ready) |
| MAX_CONTENT_LENGTH | 1 MB request body limit |
| Security headers | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`, HSTS in production |
| Error handlers | Global handlers for 429, 413, 500 — return clean JSON, no stack traces |
| Swagger guard | Swagger UI disabled when `FLASK_ENV=production` |
| Host binding | Changed from `0.0.0.0` to `127.0.0.1` (configurable via `HOST`) |
| Debug mode | Env-controlled: `FLASK_ENV=production` disables debug |

### Modified: Route files (per-route rate limits)

| File | Rate Limit |
|---|---|
| `routes/disruptions.py` | 10/min list, 5/min POST, 3/min recommendation (LLM) |
| `routes/signals.py` | 30/min GET, 5/min detect (LLM) + input caps (headline ≤500, body ≤5000 chars) |
| `routes/stream.py` | 2/min + 30-minute SSE timeout |
| `routes/research.py` | 5/min task creation + 10-minute SSE timeout |
| `routes/recommendations.py` | 5/min generate |
| `routes/shipments.py` | Query capped at 200 results |

### Modified: `requirements.txt`

Added `Flask-Limiter==3.8.0` and `Flask-Cors==5.0.0`.

---

## Phase 6: Documentation

### New Files

| File | Description |
|---|---|
| `README.md` (root) | Project overview, architecture diagram, quick start, API reference, security summary, env vars |
| `frontend/README.md` | Component documentation, design system colors, setup instructions, origin table |
| `CHANGELOG.md` | This file |

### Modified Files

| File | Change |
|---|---|
| `backend/README.md` | Added sections: New Features (Ported), Visual Dashboard, Security, new env vars |

---

## Complete File Inventory (new + modified)

### New Files (20)

```
backend/extensions.py
backend/services/exposure.py
backend/services/optimizer.py
backend/services/llm_generator.py
backend/services/perception.py
backend/routes/disruptions.py
backend/routes/dashboard.py
backend/routes/signals.py
backend/static/index.html
backend/fixtures/company.json
backend/fixtures/strategies.json
frontend/README.md
frontend/src/pages/LandingPage.tsx
frontend/src/components/SupplyChainGlobe.tsx
frontend/src/components/LiveSignalsPanel.tsx
frontend/src/components/KeywordMonitor.tsx
frontend/src/hooks/useScrollAnimations.ts
README.md
CHANGELOG.md
```

### Modified Files (9)

```
backend/app.py              — Security hardening, blueprint registration, dashboard route
backend/models.py            — 4 new SQLAlchemy models
backend/seed.py              — Company + Strategy seeding
backend/requirements.txt     — +flask-limiter, +flask-cors
backend/README.md            — New features, security, env vars
backend/routes/stream.py     — SSE timeout + rate limit
backend/routes/research.py   — SSE timeout + rate limits
backend/routes/recommendations.py — Rate limit
backend/routes/shipments.py  — Query limit
```
