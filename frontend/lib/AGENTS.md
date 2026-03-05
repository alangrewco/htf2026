# AGENTS: Mock Data + Backend Integration Guide

This guide defines the 4 cases to use when adding data for new pages, refactoring mock data, or adopting new backend endpoints.

## Non-negotiable rules

- Frontend must always be testable without the backend running.
- Use realistic, deterministic mock data (not faker-style random data) for local development and tests.
- Keep generated `sdk/` files untouched; put deterministic fixtures in `lib/fixtures/...` and wire them via `lib/msw/handlers.ts`.

## Quick decision flow

1. Does a backend endpoint already exist for the UI need?
2. If yes, is the backend payload already sufficient for the UI?
3. If no endpoint exists, use a local UI mock module under `lib/api/ui/...`.
4. If endpoint exists but current mock data is missing backend fields, migrate mock data to backend schema.

Use the case definitions below.

---

## Case 1 — Backend equivalent exists and schema is sufficient

### Case 1 criteria

- Backend endpoint exists.
- UI can render directly from backend fields (or with simple mapping only).

### Case 1 implementation

- Use generated Orval SDK hooks.
- Keep mapping in `lib/api/<domain>/...` adapters if needed.
- Create deterministic fixtures that adhere to backend endpoint schema so frontend remains backend-independent.
- Use MSW overrides to return these fixtures during mock mode.

### Case 1 file placement

- Adapter/composition hook: `lib/api/<domain>/...`
- Schema-aligned fixtures: `lib/fixtures/<domain>/...`
- MSW wiring: `lib/msw/handlers.ts`
- SDK usage: `sdk/...` (generated; do not hand-edit)

### Case 1 MSW behavior

- Prefer deterministic handler overrides backed by `lib/fixtures/<domain>/...`.
- Do not rely on faker-generated mock payloads.

---

## Case 2 — No backend equivalent exists yet

### Case 2 criteria

- UI needs data that does not exist in OpenAPI/backend yet.

### Case 2 implementation

- Build local SWR-backed mock module.
- Keep data and types local to the folder path `lib/api/ui/...`.
- Treat this as intentionally local until backend contract exists.
- Use realistic deterministic mock values.

### Case 2 file placement

- UI-facing hook/module: `lib/api/ui/<feature>.ts`
- Optional extracted fixtures for large payloads: `lib/fixtures/ui/<feature>.ts`

### Case 2 notes

- Keep public shape stable so UI migration to backend is easy later.
- Add a follow-up note in `TODO.md` if backend work is expected.

---

## Case 3 — Backend equivalent exists but payload is missing UI-critical fields

### Case 3 criteria

- Endpoint exists, but response lacks required fields for current UX.

### Case 3 implementation

- Degrade to Case 2 behavior for now.
- Do not augment or patch backend response shape in frontend adapter.
- Implement the page with local realistic mock module under `lib/api/ui/...`.
- Track exact schema gaps explicitly in `TODO.md` so backend can add missing fields.

### Case 3 file placement

- Local UI mock module: `lib/api/ui/<feature>.ts`
- Optional extracted fixtures: `lib/fixtures/ui/<feature>.ts`
- Gap tracking: `TODO.md`

### Case 3 exit criteria

- Once backend adds missing fields, migrate from `lib/api/ui/<feature>.ts` to Case 1 (`lib/api/<domain>/...` + schema fixtures).

---

## Case 4 — Existing mock data misses backend fields

### Case 4 criteria

- Backend endpoint exists.
- Existing mock data exists, but it is missing fields now required by backend schema.

### Case 4 implementation

- Migrate existing mock data to backend endpoint schema.
- Add any missing backend fields with sensible, realistic mock values.
- Then use the Case 1 runtime pattern (SDK hooks + deterministic fixture-backed MSW overrides).

### Case 4 file placement

- Fixture payloads: `lib/fixtures/<domain>/...`
- Overrides/handler composition: `lib/msw/handlers.ts`
- Adapter hook: `lib/api/<domain>/...`

---

## Placement rules (important)

- `lib/api/` = UI-facing data hooks/adapters (read/write, composition, mapping).
- `lib/api/ui/` = local UI-only SWR modules used in Case 2/3.
- `lib/fixtures/` = static deterministic payloads that mirror endpoint or UI contracts.
- `lib/msw/` = runtime interception wiring and handler composition.
- `sdk/` = generated code only (regenerate via Orval; no manual edits).
- Avoid faker/randomized mock generation for real page workflows.

---

## Checklist for adding a new backend-backed page

1. Regenerate SDK/MSW from OpenAPI (`orval.config.ts` controls generation).
2. Classify endpoint usage into Case 1/2/3/4.
3. If Case 1, add/update adapter in `lib/api/<domain>/...`.
4. Add realistic deterministic fixtures (`lib/fixtures/...`) for frontend-only testing.
5. Register/update MSW overrides in `lib/msw/handlers.ts`.
6. If Case 3, implement locally in `lib/api/ui/...` and add schema-gap note to `TODO.md`.
7. If Case 4, migrate old mock shape to backend schema and fill missing fields.
8. Confirm runtime behavior with `NEXT_PUBLIC_USE_MSW=true|false`.
9. If backend gaps exist, record them in `TODO.md`.

---

## Checklist for refactoring existing mock data

1. For each dataset, classify into one of the 4 cases.
2. If endpoint exists and schema is sufficient, move to Case 1 pattern.
3. If endpoint does not exist, move to `lib/api/ui/...` (Case 2).
4. If endpoint exists but schema is missing fields, keep local UI module and log `TODO.md` (Case 3).
5. If existing mock data misses backend fields, migrate shape and add missing backend fields with realistic values (Case 4).
6. Wire deterministic fixtures through `lib/msw/handlers.ts`.
7. Remove stale copies and dead imports.

---

## Runtime notes

- `NEXT_PUBLIC_USE_MSW=true`: force MSW on.
- `NEXT_PUBLIC_USE_MSW=false`: force MSW off.
- In development, MSW may default on unless explicitly disabled.
- Mock mode should remain sufficient for page development even when backend is unavailable.

For broader runtime behavior details, see `docs/agent_plans/api_fixtures_msw_runtime.md`.
