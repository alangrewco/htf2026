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

### Frontend-only properties needing backend equivalents

The following properties are used in the frontend UI but have **no backend field**.
They are currently served from fixed demo values in `lib/fixtures/reference/demo-enrichments.ts`.

#### SKU enrichments
- `riskScore` — numeric risk score (0–100) per SKU
- `riskLevel` — categorical risk level (`critical` / `high` / `medium` / `low`)
- `revenue` — revenue associated with the SKU
- `category` — product category (currently derived from `description` as a workaround)

#### Shipment enrichments
- `carrier` — shipping carrier name (e.g. "Maersk", "COSCO")

#### Supplier enrichments
- `region` — geographic region grouping (e.g. "Asia Pacific", "Europe")
- `riskRating` — supplier-level risk rating

#### Cross-entity associations
- Supplier → SKU list: currently **derived at runtime** from `Shipment.sku_ids` and `Shipment.supplier_id`. This works but means a supplier's SKU list only includes SKUs on active shipments, not historical ones. The backend should ideally provide a direct `sku_ids` field on Supplier.
