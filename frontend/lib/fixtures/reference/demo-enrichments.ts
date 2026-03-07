/**
 * Fixed demo values for properties that have NO backend equivalent yet.
 *
 * These are NOT keyed by entity ID — all entities use the same values.
 * This is intentional: the backend should own this data, and until it does,
 * we surface clearly fake placeholder values.
 *
 * TODO: Every property here needs a backend equivalent.
 * See TODO.md for tracking.
 */

// SKU enrichments — TODO: add riskScore, riskLevel, revenue, category to backend SKU
export const DEMO_SKU_ENRICHMENT = {
  riskScore: 65,
  riskLevel: "medium" as const,
  revenue: 100_000,
  category: "General",
};

// Shipment enrichments — TODO: add carrier to backend Shipment
export const DEMO_SHIPMENT_ENRICHMENT = {
  carrier: "TBD",
};

// Supplier enrichments — TODO: add region, riskRating to backend Supplier
export const DEMO_SUPPLIER_ENRICHMENT = {
  region: "Unknown",
  riskRating: "medium" as const,
};
