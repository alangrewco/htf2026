# HarborGuard AI

### Test our prototype live! https://htf2026.vercel.app

HarborGuard AI is an operations-focused supply-chain risk platform that helps teams move from early warning signals to concrete, executable response plans.

The product is designed around one core promise:

- Detect disruption risk quickly
- Explain impact in business terms
- Recommend alternatives with tradeoffs
- Execute chosen plans in a guided workflow

## What the Product Does

### 1. Unified Risk Visibility Across SKUs, Suppliers, and Shipments

- The Data Explorer presents SKUs with risk scores and risk levels.
- Each SKU is connected to supplier and shipment relationships.
- Operators can switch between SKU, Shipment, and Supplier views without losing context.
- This supports both top-down triage and bottom-up root-cause analysis.

### 2. Fast Entity Onboarding (New SKU / Supplier / Shipment)

- Users can add new records through guided creation modals.
- SKU creation supports:
  - SKU metadata (code, category, status)
  - linking existing suppliers/shipments
  - creating new suppliers/shipments inline
- New records are immediately available in operational views and downstream analysis flows.

### 3. Analysis Jobs and Operational Throughput

- Jobs can be launched from the Analysis Jobs page.
- Each run exposes a lifecycle (`queued` -> `running` -> `completed` / `failed`) and run stats.
- Active timer/status indicators make progress visible in real time.
- This workflow is built for high-speed decision cycles under disruption pressure.

### 4. Live Signals and News Intelligence

- Live Signals provides a continuously-updating feed format for disruption-relevant events.
- Signals are filterable by type (geopolitical, weather, financial, logistics, labor).
- Users can pivot from the command-center feed into a dedicated News experience for deeper context.

### 5. Action Cards and Plan Comparison

- Action Required cards convert detection into concrete decision objects.
- Each card includes:
  - impact summary
  - category and urgency
  - comparison matrix (cost, time, risk)
  - actionable step lists
- This helps teams evaluate alternatives quickly with explicit tradeoffs.

### 6. AI Brainstorm + Guided Execution

- Brainstorm mode supports interactive refinement of mitigation approaches.
- After selecting a plan, users can execute it through an execution modal with step-by-step progress.
- Execution supports mixed step types:
  - autonomous
  - semi-autonomous
  - manual confirmation

## End-to-End System Flow

At a high level, HarborGuard follows this pipeline:

1. Ingest external and internal-relevant signal inputs.
2. Enrich each item with structured risk metadata.
3. Classify incidents and derive disruption relevance.
4. Generate action proposals tied to business context.
5. Present decision options in UI with cost/time/risk framing.
6. Execute selected plans with status-tracked steps.

## Frontend Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling/UI:** Tailwind CSS v4, Radix UI primitives, shadcn/ui patterns
- **Component UX:** Lucide icons, Framer Motion animations, Streamdown rich text rendering
- **Data Layer:** SWR hooks with generated API clients
- **API Client Generation:** Orval-generated SDK from OpenAPI
- **Mocking/Fixtures:** MSW with deterministic fixture payloads for local development
- **Visualization:** Globe.gl for geographic incident-style map views

### Frontend Behavior Notes

- `NEXT_PUBLIC_USE_MSW=true` forces local mock APIs.
- In development, mocks are enabled unless explicitly disabled.
- `NEXT_PUBLIC_USE_MSW=false` uses real backend APIs.
- `BACKEND_ORIGIN` configures Next.js rewrite proxy targets for `/reference`, `/ingestion`, `/articles`, `/incidents`, `/proposals`, `/company`, `/config`, and `/feedback`.

## Backend Tech Stack

- **Runtime:** Python 3.10
- **API Layer:** Flask + Connexion (OpenAPI-first generated server)
- **Schema/Contracts:** OpenAPI 3.0.3 with generated server scaffolding
- **ORM/Data Access:** SQLAlchemy
- **Database Driver:** `psycopg2-binary` for relational database connectivity
- **Cross-Origin / API Tooling:** `flask-cors`, Swagger UI
- **AI Agents:** Google Agent ADK-style enrichment and incident agents, with Gemini-backed and mock providers
- **Processing Model:** Asynchronous ingestion + enrichment workers using threaded background processing

### Backend Capability Areas

- **Reference APIs:** SKUs, suppliers, shipments, ports, routes
- **Ingestion APIs:** run creation, run status, scheduler status
- **Articles APIs:** list/detail/enrichment access
- **Incidents APIs:** incident list/detail and incident-driven proposal generation
- **Proposals APIs:** list/detail/decision lifecycle
- **Company Config APIs:** autonomy/risk profile settings
- **Feedback APIs:** proposal feedback capture

## Deployment

- **Frontend hosting platform:** Firebase
- **Backend runtime platform:** Google Cloud Platform (Cloud Run)
- **AI execution ecosystem:** Google Agent ADK workflows with Gemini integration

This deployment model is optimized for rapid iteration and demo-to-production evolution.

## Local Development

### Frontend

```bash
cd frontend
npm install
BACKEND_ORIGIN=http://127.0.0.1:8080 NEXT_PUBLIC_USE_MSW=false npm run dev
```

To run UI against mocks:

```bash
cd frontend
NEXT_PUBLIC_USE_MSW=true npm run dev
```

### Backend

Create generated-server virtual environment once:

```bash
cd backend/generated/flask-server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Then run backend:

```bash
cd backend
./scripts/run_generated_server.sh
```

Swagger UI:

- `http://localhost:8080/api/v1/ui/`

## Repository Layout

- `frontend/`: Next.js application and UI workflows
- `backend/`: OpenAPI spec, generated Flask server, business services, and deploy scripts
- `docs/`: implementation notes, plans, and demo artifacts
