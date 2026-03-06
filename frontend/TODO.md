# TODO

## Mock/Data migration follow-ups

### Case 3: Backend equivalent exists but is missing key UI properties

- Action Cards currently map conceptually to `Incident` + `ActionProposal` payloads, but the API schema is missing several fields required by the existing UI/UX model:
  - `affectedValue` (numeric impact shown in card meta)
  - `affectedSKUs` (quick cardinality shown in card meta)
  - Structured narrative arrays (`whatHappened`, `howItAffects`)
  - Rich execution UX fields used by `ExecutePlanModal`:
    - `executionSteps[].autonomousPreview`
    - `executionSteps[].draftContent`
    - `executionSteps[].manualInstruction`
- Current implementation keeps these in `lib/api/ui/action-cards.ts` with SWR-style access (`useActionCards`) until backend contracts are expanded.

### Case 2: No backend endpoint exists yet

- **SKU / Shipment / Supplier detail modals** — The dashboard Data Explorer lists SKUs, shipments, and suppliers via existing list endpoints. However, clicking a row opens a detail modal that requires drill-down data (specifications, tracking events, supplier performance, etc.) not in any backend endpoint. Detail data is currently served from `lib/api/ui/detail-data.ts`. Once backend adds `/skus/{id}`, `/shipments/{id}`, and `/suppliers/{id}` detail endpoints, migrate to Case 1.
