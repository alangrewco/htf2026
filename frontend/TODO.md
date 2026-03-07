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

### Creation modal limitations

- **Import button** is a visual stub — no backend upload/import endpoint exists.
- **No direct SKU ↔ Supplier linking API** — the association is implicit through Shipments. The SKU creation wizard creates shipments to establish the link. The Supplier wizard's "Add SKUs" step creates the SKU but cannot link it to the supplier without also creating a shipment.
- **`route_id`** on `CreateShipmentRequest` has no route reference endpoint — defaults to empty string.
- **Cannot add new SKU to existing shipment** — the Create Shipment API creates a fresh shipment; there is no update-shipment endpoint used to add SKUs to an existing shipment from the SKU wizard.

