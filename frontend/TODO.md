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

### Creation modal limitations

- **Import button** is a visual stub — no backend upload/import endpoint exists.
- **`route_id`** on `CreateShipmentRequest` has no route reference endpoint — defaults to empty string.
- **Cannot add new SKU to existing shipment** — the Create Shipment API creates a fresh shipment; there is no update-shipment endpoint used to add SKUs to an existing shipment from the SKU wizard.
