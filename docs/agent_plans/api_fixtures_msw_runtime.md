# Mock vs Real Runtime Behavior (SWR + Orval + MSW)

## Why you barely see `@/sdk` imports in UI code

The generated SDK is intentionally centralized in adapter/mocking layers instead of being imported everywhere in components.

- `@/sdk/reference/reference` hooks are used in `frontend/lib/api/reference/use-reference-data.ts`.
- Components consume that adapter (`useReferenceData`) rather than calling SDK hooks directly.
- This keeps UI props stable while backend schema evolves.

So SDK is used, but mostly behind `lib/api/*` and `lib/msw/*`.

## What actually happens at runtime right now

### Development defaults (mock ON)

- `frontend/components/mock-provider.tsx` starts MSW in dev by default.
- Orval-generated handlers are mounted from `frontend/lib/msw/handlers.ts`.
- Requests from generated SWR hooks (e.g. `/reference/skus`) are intercepted by MSW.
- For `reference` list endpoints, deterministic mock overrides are returned from:
  - `frontend/lib/fixtures/reference/skus.ts`
  - `frontend/lib/fixtures/reference/suppliers.ts`
  - `frontend/lib/fixtures/reference/shipments.ts`

### Real server mode (mock OFF)

- Set `NEXT_PUBLIC_USE_MSW=false`.
- `MockProvider` will skip worker startup.
- SDK fetches go to real network routes.

### Non-backend UI domains (always local mock data)

These are currently case 2/3 and remain local SWR wrappers by design:

- `frontend/lib/api/ui/kpis.ts`
- `frontend/lib/api/ui/live-signals.ts`
- `frontend/lib/api/ui/action-cards.ts`

Even in real-server mode, those stay local until backend endpoints/contracts are added.

## How to test against a real backend

## 1) Start backend server

From `frontend/backend/generated/flask-server`:

```bash
pip3 install -r requirements.txt
python3 -m openapi_server
```

Expected server base: `http://localhost:8080/api/v1`.

## 2) Start frontend with mocks disabled + proxy rewrites enabled

From `frontend/frontend`:

```bash
NEXT_PUBLIC_USE_MSW=false BACKEND_ORIGIN=http://localhost:8080 npm run dev
```

`next.config.ts` rewrites API-like frontend paths to backend `/api/v1/*`.
Example: `/reference/skus` -> `http://localhost:8080/api/v1/reference/skus`.

## 3) Verify in browser devtools

- Open Network tab.
- Confirm calls are real HTTP requests (not marked by MSW interception).
- Confirm responses come from backend host via rewrite.

## 4) If you want mock mode again

```bash
NEXT_PUBLIC_USE_MSW=true npm run dev
```

(or just omit `NEXT_PUBLIC_USE_MSW`; dev defaults to mock ON).

## Notes

- In real-server mode, `useReferenceData` no longer silently falls back to static reference lists when requests fail.
- If backend routes are down/misconfigured, SKUs/Shipments/Suppliers sections may be empty rather than showing mock data.
