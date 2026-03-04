# HarborGuard AI — Architecture & Workflow Reference

> **Purpose**: This document describes the complete system architecture, data flows, algorithms, and user workflows of HarborGuard AI. It is designed to be used as input for generating presentation diagrams (system architecture, sequence diagrams, flowcharts, data flow diagrams, etc.).

---

## 1. System Overview

**HarborGuard AI** is a real-time maritime supply chain risk intelligence platform. It monitors global news and weather feeds, detects port disruptions using AI, calculates financial exposure across the supply chain, evaluates mitigation strategies, and generates LLM-powered recommendations with ready-to-send communications.

### Core Value Proposition

```
Raw Data → Intelligence → Decision → Action
(News/Weather)  (AI Classification)  (Strategy Optimization)  (Draft Communications)
```

### Tech Stack

| Layer | Technology |
|---|---|
| Backend Framework | Flask + flask-smorest (OpenAPI) |
| Database | SQLite + SQLAlchemy ORM |
| AI/LLM | Google Gemini via google-adk |
| Background Jobs | APScheduler |
| Real-time Streaming | Server-Sent Events (SSE) |
| External Data | GDELT, Open-Meteo Marine, RSS Feeds |
| Security | flask-limiter, flask-cors, security headers |
| Frontend | React + TypeScript (component library) |

---

## 2. High-Level Architecture Diagram

**Diagram Type**: System Architecture / C4 Container Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         HARBORGUARD AI PLATFORM                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────────────┐     ┌──────────────────────────────────────┐     │
│   │   EXTERNAL DATA  │     │           FLASK API SERVER            │     │
│   │   SOURCES         │     │                                      │     │
│   │                   │     │  ┌────────────┐  ┌──────────────┐   │     │
│   │  ● GDELT News API │────▶│  │ Ingestion   │  │ Rate Limiter  │   │     │
│   │  ● Open-Meteo     │     │  │ Layer       │  │ + CORS        │   │     │
│   │  ● RSS Feeds (5)  │     │  └─────┬──────┘  └──────────────┘   │     │
│   └─────────────────┘     │        │                              │     │
│                            │        ▼                              │     │
│   ┌─────────────────┐     │  ┌────────────┐                      │     │
│   │  GOOGLE GEMINI   │     │  │  SQLite DB  │◀──────────────────┐ │     │
│   │  (AI/LLM)        │     │  │  (14 tables)│                   │ │     │
│   │                   │     │  └─────┬──────┘                   │ │     │
│   │  ● Classification │◀───│        │                           │ │     │
│   │  ● Enrichment     │     │        ▼                           │ │     │
│   │  ● Draft Gen      │     │  ┌────────────┐  ┌─────────────┐ │ │     │
│   └─────────────────┘     │  │ Services    │  │ API Routes  │ │ │     │
│                            │  │ (12 modules)│  │ (10 blueprints)│ │     │
│                            │  └────────────┘  └──────┬──────┘ │ │     │
│                            │                          │        │ │     │
│                            └──────────────────────────┼────────┘ │     │
│                                                       │          │     │
│   ┌─────────────────┐     ┌──────────────────────────▼────────┐ │     │
│   │  APSCHEDULER     │     │         FRONTEND (React/TS)       │ │     │
│   │  (Background)    │     │                                    │ │     │
│   │                   │     │  ● Visual Dashboard (HTML)         │ │     │
│   │  ● Weather 15min │     │  ● LiveSignalsPanel                │ │     │
│   │  ● GDELT 10min   │     │  ● KeywordMonitor (Risk Radar)    │ │     │
│   │  ● Research 1min │     │  ● SupplyChainGlobe               │ │     │
│   └─────────────────┘     │  ● LandingPage                     │ │     │
│                            └────────────────────────────────────┘ │     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Model (Entity Relationship)

**Diagram Type**: ER Diagram

### Core Entities and Relationships

```
Companies (1) ─────── Risk DNA Profile
    │
    │ Risk Tolerance, SLA Weight, Working Capital
    │
    ▼
Disruptions (many) ───────── linked to ──── Ports (FK)
    │
    │ Triggers pipeline
    │
    ├──▶ Exposure Analysis ──▶ SKUs + Inventory + Shipments
    │
    ├──▶ Strategy Comparison ──▶ Strategies (4 templates)
    │
    └──▶ MitigationRecommendations
              │
              └──▶ LLM Drafts (supplier email, logistics, exec summary)
```

### Full Table List (14 tables)

| Table | Key Fields | Role |
|---|---|---|
| `risk_events` | title, severity (0-100), event_type (NEWS/WEATHER), impacted_ports[], impacted_countries[], dedupe_key | Central event store |
| `research_tasks` | event_id (FK), mode, status (queued/running/done/failed) | ADK enrichment queue |
| `research_findings` | task_id (FK), event_id (FK), finding_json | Enrichment results |
| `ports` | code (PK), name, country, lat, lon | Port reference data |
| `skus` | name, unit_cost, revenue_impact_per_day_stockout | Product catalog |
| `inventory` | sku_id (FK), on_hand, reorder_point | Current stock levels |
| `shipments` | sku_id (FK), origin_port (FK), dest_port (FK), etd, eta, status | In-transit goods |
| `carriers` | name | Shipping line reference |
| `routes` | name, waypoints_json[] | Trade lane definitions |
| `suppliers` | name, country | Supplier reference |
| `companies` | name, revenue_annual_millions, risk_tolerance, sla_weight, working_capital_limit, customer_churn_sensitivity, sla_target_percent | Single-tenant company profile |
| `disruptions` | port_code (FK), disruption_type, severity_score, expected_delay_days, confidence_score, is_active | Port disruption events |
| `strategies` | name, air_freight_percent, reroute_percent, buffer_stock_percent, cost_multipliers, is_active | Mitigation templates |
| `mitigation_recommendations` | disruption_id (FK), strategy_id (FK), reasoning, revenue_preserved, mitigation_cost, sla_achieved, generated_email_supplier, generated_email_logistics, generated_executive_summary, requires_approval | Final AI recommendations |
| `recommendations` | profile, sku_id (FK), horizon_days, score, recommendation_json, weights_json | Risk-aware SKU recommendations |
| `recommendation_feedback` | recommendation_id (FK), accepted, reason_code | Preference learning feedback |
| `preferences` | profile, w_cost, w_speed, w_risk, blocked_ports[], preferred_carriers[] | User preference weights |

---

## 4. Core Workflow: Disruption Response Pipeline

**Diagram Type**: Sequence Diagram or Flowchart

This is the primary end-to-end workflow. It is triggered when a disruption is created.

### Step-by-step flow:

```
[News Feed / User Input]
        │
        ▼
┌──── STEP 1: DETECTION ────┐
│  Perception Service         │
│  (perception.py)            │
│                             │
│  Input: headline + body     │
│  Method: Gemini LLM         │
│  Fallback: Keyword matching │
│                             │
│  Output:                    │
│  ├── is_disruption: bool    │
│  ├── port_code: "CNSHA"     │
│  ├── disruption_type        │
│  ├── severity_score: 0-1    │
│  └── expected_delay_days    │
└──────────┬──────────────────┘
           │ Creates Disruption record
           ▼
┌──── STEP 2: EXPOSURE ANALYSIS ────┐
│  Exposure Service                   │
│  (exposure.py)                      │
│                                     │
│  Queries:                           │
│  ├── Shipments at disrupted port    │
│  ├── SKUs on those shipments        │
│  └── Current inventory levels       │
│                                     │
│  Calculates per-SKU:                │
│  ├── Inventory runway days          │
│  ├── Stockout date projection       │
│  ├── Revenue at risk                │
│  ├── Safety stock (Newsvendor)      │
│  │   z_α × σ_demand × √LeadTime    │
│  ├── Coverage ratio                 │
│  └── Risk grade (A/B/C/D/F)        │
│                                     │
│  Output:                            │
│  ├── total_revenue_at_risk          │
│  ├── total_margin_at_risk           │
│  └── affected_skus[] with grades    │
└──────────┬──────────────────────────┘
           │
           ▼
┌──── STEP 3: STRATEGY EVALUATION ────┐
│  Optimizer Service                    │
│  (optimizer.py)                       │
│                                       │
│  For each strategy (S1-S4):          │
│  ├── S1: Emergency Air (100% air)    │
│  ├── S2: Reroute Priority (80%)      │
│  ├── S3: Buffer Stock (100% buffer)  │
│  └── S4: Balanced Hybrid (split)     │
│                                       │
│  Risk DNA Objective Function:         │
│  ┌─────────────────────────────────┐ │
│  │ Score = α·Revenue − β·Cost      │ │
│  │         − δ·SLA_Penalty          │ │
│  │                                  │ │
│  │ α = risk_tolerance               │ │
│  │ β = 1 − risk_tolerance           │ │
│  │ δ = sla_weight × churn_sens.     │ │
│  └─────────────────────────────────┘ │
│                                       │
│  Constraints:                         │
│  ├── Working capital feasibility      │
│  └── SLA target threshold            │
│                                       │
│  Output:                              │
│  ├── simulations[] ranked by score    │
│  └── optimal_strategy_id             │
└──────────┬────────────────────────────┘
           │
           ▼
┌──── STEP 4: AI RECOMMENDATION ────┐
│  LLM Generator Service              │
│  (llm_generator.py)                  │
│                                      │
│  Input: Company profile +            │
│         Disruption details +         │
│         Optimal strategy metrics     │
│                                      │
│  Generates via Gemini:               │
│  ├── Supplier email (reroute)        │
│  ├── Logistics request (air freight) │
│  └── Executive summary (COO brief)   │
│                                      │
│  Fallback: Template-based drafts     │
│                                      │
│  Stored as:                          │
│  MitigationRecommendation record     │
│  with requires_approval = true       │
└──────────┬────────────────────────────┘
           │
           ▼
┌──── STEP 5: HUMAN DECISION ────┐
│  Dashboard UI                    │
│                                  │
│  Displays:                       │
│  ├── Financial exposure metrics  │
│  ├── Strategy comparison cards   │
│  ├── AI reasoning                │
│  └── Ready-to-send draft emails  │
│                                  │
│  Actions:                        │
│  ├── Approve & Execute           │
│  └── Review Details / Reject     │
└──────────────────────────────────┘
```

---

## 5. Data Ingestion Pipeline

**Diagram Type**: Flowchart or Data Flow Diagram

### Continuous Data Sources

```
                    ┌──────────────────────────┐
                    │    APSCHEDULER JOBS       │
                    │    (Background Thread)    │
                    └──────────┬───────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
     ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
     │  WEATHER      │  │  GDELT NEWS  │  │  RESEARCH    │
     │  (15 min)     │  │  (10 min)    │  │  (1 min)     │
     │               │  │              │  │              │
     │  Open-Meteo   │  │  Main query  │  │  ADK Agent   │
     │  Marine API   │  │  + follow-up │  │  enrichment  │
     │               │  │  after 10s   │  │  of queued   │
     │  3 waypoints: │  │              │  │  tasks       │
     │  CNSHA,USLAX, │  │  If 429:     │  │              │
     │  USSEA        │  │  RSS fallback│  │  ThreadPool  │
     └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
            │                 │                 │
            ▼                 ▼                 ▼
     ┌────────────────────────────────────────────────┐
     │            risk_events TABLE                    │
     │                                                 │
     │  Deduplication: dedupe_key (SHA1 hash)          │
     │  GDELT: normalized title hash                   │
     │  Weather: waypoint+date+type hash               │
     │  RSS: link SHA1                                  │
     └─────────────────────────────────────────────────┘
```

### Live Signals (On-Demand)

```
     ┌────────────────────┐
     │  USER REQUEST       │
     │  GET /api/signals   │
     │  ?keywords=...      │
     └────────┬───────────┘
              │
              ▼
     ┌────────────────────────────────────┐
     │  RSS PROXY (routes/signals.py)     │
     │                                     │
     │  Fetches from 5 feeds:              │
     │  ├── gCaptain Maritime              │
     │  ├── Splash247 Shipping             │
     │  ├── FreightWaves                   │
     │  ├── The Maritime Executive         │
     │  └── FleetMon Maritime News         │
     │                                     │
     │  Processing:                        │
     │  1. Parse XML/Atom                  │
     │  2. Extract title/link/published    │
     │  3. Keyword match (word-boundary    │
     │     regex: \\bkeyword\\b)            │
     │  4. Sort by published_at desc       │
     │  5. Apply limit                     │
     └────────────────────────────────────┘
```

---

## 6. ADK Research Enrichment Pipeline

**Diagram Type**: Sequence Diagram

```
[Research Task Queue]          [ADK Agent]             [Gemini LLM]
        │                          │                        │
        │  Batch (up to 200)       │                        │
        ├─────────────────────────▶│                        │
        │                          │   Structured prompt    │
        │                          ├───────────────────────▶│
        │                          │                        │
        │                          │   JSON response:       │
        │                          │   - enhanced severity  │
        │                          │   - confidence score   │
        │                          │   - impacted_ports[]   │
        │                          │   - impacted_countries[]│
        │                          │   - time_window        │
        │                          │◀───────────────────────┤
        │                          │                        │
        │   Update RiskEvent +     │                        │
        │   Create ResearchFinding │                        │
        │◀─────────────────────────┤                        │
        │                          │                        │
        │  Mark task: done/failed  │                        │
        │◀─────────────────────────┤                        │
```

### Concurrency Model
- **ThreadPoolExecutor** with configurable max workers (default: 50)
- **Batch loops**: up to 5 iterations per scheduler tick
- **Batch size**: 200 tasks per loop
- Tasks transition: `queued → running → done | failed`
- Failures captured in `ResearchTask.error` field

---

## 7. Recommendation Engine (SKU-Level)

**Diagram Type**: Flowchart

```
[User Request]
POST /api/recommendations/generate
{ profile: "resilient", sku_ids: [1,2,3], horizon_days: 30 }
        │
        ▼
┌─────────────────────────────────────────┐
│  1. LOAD PREFERENCE WEIGHTS             │
│                                          │
│  Profile presets:                        │
│  ├── "resilient" → (0.2, 0.2, 0.6)     │
│  ├── "fast"      → (0.2, 0.6, 0.2)     │
│  └── "low_cost"  → (0.6, 0.2, 0.2)     │
│                                          │
│  Override with user preferences if saved │
│  w_cost, w_speed, w_risk                 │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  2. PER-SKU SCORING                     │
│                                          │
│  For each SKU:                           │
│  a. Query shipments for that SKU         │
│  b. Find risk events matching ports      │
│  c. Average severity = risk_score        │
│  d. Unit cost = cost_score               │
│  e. ETA distance = speed_score           │
│                                          │
│  Composite score =                       │
│    w_cost × norm(cost) +                 │
│    w_speed × norm(speed) +               │
│    w_risk × norm(risk)                   │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  3. OUTPUT                              │
│                                          │
│  Recommendation record with:             │
│  ├── score                               │
│  ├── recommendation_json (actions)       │
│  ├── explanation_json (reasoning)        │
│  └── weights_json (applied weights)      │
└──────────────────────────────────────────┘
```

### Preference Learning Loop

```
[Recommendation] ──▶ [User Feedback] ──▶ [Weight Update]
                      accepted: true/false    w_cost ± 0.05
                      reason_code:            w_speed ± 0.05
                      "too_expensive"         w_risk ± 0.05
                      "too_slow"              (renormalized)
                      "too_risky"
```

---

## 8. Security Architecture

**Diagram Type**: Layer Diagram

```
┌─────────────────────────────────────────────────┐
│              INCOMING REQUEST                     │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────┐
│  LAYER 1: CORS                                    │
│  Allowed Origins: localhost:* (dev)               │
│  Configurable via CORS_ORIGINS env var            │
└──────────────────────┬───────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────┐
│  LAYER 2: RATE LIMITING (flask-limiter)           │
│                                                    │
│  Default: 60 req/min per IP                        │
│  LLM endpoints: 3-5 req/min                        │
│  SSE streams: 2 req/min                            │
│  Storage: memory:// (dev) | redis:// (prod)        │
└──────────────────────┬───────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────┐
│  LAYER 3: REQUEST VALIDATION                      │
│                                                    │
│  MAX_CONTENT_LENGTH: 1 MB                          │
│  Marshmallow schema validation                     │
│  Input length caps (headline ≤500, body ≤5000)     │
└──────────────────────┬───────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────┐
│  LAYER 4: BUSINESS LOGIC                          │
│  (Services + Models)                               │
└──────────────────────┬───────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────┐
│  LAYER 5: RESPONSE SECURITY                       │
│                                                    │
│  Security Headers:                                 │
│  ├── X-Content-Type-Options: nosniff               │
│  ├── X-Frame-Options: DENY                         │
│  ├── X-XSS-Protection: 1; mode=block               │
│  ├── Referrer-Policy: strict-origin-when-cross      │
│  └── Strict-Transport-Security (prod only)          │
│                                                    │
│  Error Sanitization:                                │
│  └── No stack traces, generic 500 messages          │
└──────────────────────────────────────────────────┘
```

---

## 9. Key Algorithms

### 9.1 Newsvendor Safety Stock Model

```
SafetyStock = z_α × σ_demand × √(LeadTime)

Where:
  z_α = 1.88 (97% service level)
  σ_demand = DailyDemand × 0.15 (15% CV)
  LeadTime = expected_delay_days

Example:
  DailyDemand = 100 units
  LeadTime = 14 days
  σ = 100 × 0.15 = 15
  SafetyStock = 1.88 × 15 × √14 = 105 units
```

### 9.2 Risk DNA Weighted Objective

```
WeightedScore = α × RevenuePreserved − β × MitigationCost − δ × SLAPenalty

Where:
  α = company.risk_tolerance (0-1)
  β = 1 − risk_tolerance
  δ = sla_weight × customer_churn_sensitivity

SLA Penalty:
  If SLA_Achieved < SLA_Target:
    PenaltyCost = ΔPoints × 100 × AnnualRevenue(M) × $10,000 × sla_weight
```

### 9.3 Risk Grades

```
Coverage Ratio = OnHand / (DailyDemand × ExpectedDelay)

Grade A: coverage ≥ 1.50  (well buffered)
Grade B: coverage ≥ 1.00  (adequate)
Grade C: coverage ≥ 0.50  (at risk)
Grade D: coverage ≥ 0.25  (critical)
Grade F: coverage < 0.25  (stockout imminent)
```

---

## 10. User-Facing Screens

**Diagram Type**: Wireframe / UI Flow

### Screen 1: Landing Page
- Hero section with animated globe showing Asia ↔ USA trade routes
- Animated statistics (events monitored, ports tracked, response time)
- Feature grid: Detection → Analysis → Decision → Action
- CTA buttons to dashboard and documentation

### Screen 2: Control Tower Dashboard
Layout: two-column (main 70%, sidebar 30%)

**Main panel:**
- Top: 4 KPI metric cards (Revenue at Risk, Active Disruptions, Affected SKUs, SLA Target)
- Tabs: Disruptions | Exposure | Strategies | Recommendation
- Disruption cards with severity badges, port, delay, confidence
- Exposure table with per-SKU risk grades (A-F color coded)
- Strategy comparison cards with ★ OPTIMAL badge
- AI recommendation panel with reasoning + approve/reject buttons
- Expandable LLM draft section (supplier email, logistics, exec summary)

**Sidebar:**
- Live Signals Feed (auto-refresh 60s, scrollable)
- Risk Radar keyword input with color-coded tags
- Signal items with source, time-ago, headline, keyword match highlights

### Screen 3: Swagger UI
- Auto-generated OpenAPI documentation
- Interactive endpoint testing
- Request/response schema visualization

---

## 11. Deployment Architecture (Production)

**Diagram Type**: Deployment Diagram

```
┌──────────────────────────────────────────────────────────┐
│                    PRODUCTION ENVIRONMENT                  │
│                                                            │
│  ┌──────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │  NGINX /      │    │  GUNICORN    │    │  REDIS       │  │
│  │  Cloudflare   │───▶│  (WSGI)      │    │  (Rate Limit │  │
│  │               │    │              │───▶│   Storage)   │  │
│  │  TLS Term.    │    │  Workers: 4  │    │              │  │
│  │  HSTS Header  │    │              │    └─────────────┘  │
│  └──────────────┘    │              │                      │
│                       │  Flask App   │    ┌─────────────┐  │
│                       │  + APSched   │───▶│  PostgreSQL  │  │
│                       │              │    │  (prod DB)   │  │
│                       └──────────────┘    └─────────────┘  │
│                                                            │
│  Environment Variables:                                     │
│  FLASK_ENV=production                                       │
│  SECRET_KEY=<random-64-hex>                                 │
│  CORS_ORIGINS=https://yourdomain.com                        │
│  RATELIMIT_STORAGE_URI=redis://redis:6379/0                 │
│  DATABASE_URL=postgresql://...                              │
│  GOOGLE_API_KEY=<gemini-key>                                │
└──────────────────────────────────────────────────────────────┘
```

---

## 12. API Route Map

**Diagram Type**: API Tree or Endpoint Map

```
/
├── /api/health                          GET     Health check
├── /api/events                          GET     Query risk events
│   ├── /<id>                            GET     Event detail
│   └── /summary                         GET     Aggregated stats
├── /api/stream
│   └── /events                          GET     SSE live event stream
├── /api/signals                         GET     RSS maritime signals
│   └── /detect                          POST    LLM news classification
├── /api/disruptions                     GET/POST CRUD disruptions
│   └── /<id>
│       ├── /exposure                    GET     Financial exposure
│       ├── /strategies                  GET     Strategy comparison
│       ├── /recommendation              GET     AI recommendation
│       └── /resolve                     POST    Mark resolved
├── /api/dashboard                       GET     Aggregated dashboard
├── /api/shipments                       GET     List shipments
│   └── /<id>
│       └── /risks                       GET     Matched risk events
├── /api/recommendations
│   ├── /generate                        POST    Generate recommendations
│   └── /<id>
│       └── /feedback                    POST    Submit feedback
├── /api/preferences                     GET/PUT  User weights
├── /api/research
│   ├── /tasks                           POST    Create research task
│   ├── /tasks/bulk                      POST    Bulk enqueue
│   ├── /tasks/<id>                      GET     Task status
│   ├── /findings                        GET     Enrichment results
│   ├── /progress                        GET     Progress snapshot
│   └── /stream/progress                 GET     SSE progress stream
└── /swagger-ui                          GET     API documentation
```

---

## 13. Suggested Diagrams for Presentation

| # | Diagram | Type | Key Story |
|---|---|---|---|
| 1 | **System Architecture** | C4 Container | Shows all components and their connections |
| 2 | **Disruption Response Pipeline** | Sequence / Flow | The 5-step Detection → Decision flow |
| 3 | **Data Ingestion Pipeline** | Data Flow | GDELT + Weather + RSS → risk_events |
| 4 | **Entity Relationship Diagram** | ERD | 14 tables and their foreign keys |
| 5 | **Security Layer Diagram** | Layer / Onion | 5 concentric security layers |
| 6 | **Risk DNA Objective Function** | Math / Formula | α·R − β·C − δ·P with variable labels |
| 7 | **Strategy Comparison Visual** | Bar Chart / Matrix | S1-S4 trade-offs (cost vs revenue vs SLA) |
| 8 | **LLM Integration Points** | Highlight Map | 3 places Gemini is used and their fallbacks |
| 9 | **Dashboard Wireframe** | UI Mockup | Control Tower layout with annotations |
| 10 | **Deployment Architecture** | Infrastructure | Nginx → Gunicorn → Redis + Postgres |
| 11 | **Preference Learning Loop** | Cycle Diagram | Recommend → Feedback → Weight Update → Re-recommend |
| 12 | **API Endpoint Map** | Tree / Sunburst | All 30 routes organized by domain |
