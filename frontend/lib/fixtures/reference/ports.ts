import type { ReferenceListResponse } from "@/sdk/model";

/**
 * Deterministic port reference data for MSW/mock mode.
 * Matches the port IDs used in the shipment fixture data.
 */
export const mockPortListResponse: ReferenceListResponse = {
  items: [
    { id: "port_ham", name: "Hamburg", code: null },
    { id: "port_hkg", name: "Hong Kong", code: null },
    { id: "port_hou", name: "Houston", code: null },
    { id: "port_jbl", name: "Jebel Ali", code: null },
    { id: "port_lax", name: "Los Angeles", code: null },
    { id: "port_lgb", name: "Long Beach", code: null },
    { id: "port_mnz", name: "Manzanillo", code: null },
    { id: "port_nwk", name: "Port Newark", code: null },
    { id: "port_pnm", name: "Panama Canal Atlantic", code: null },
    { id: "port_rot", name: "Rotterdam", code: null },
    { id: "port_shg", name: "Shanghai", code: null },
    { id: "port_sin", name: "Singapore", code: null },
    { id: "port_van", name: "Vancouver", code: null },
  ],
  total: 13,
};
