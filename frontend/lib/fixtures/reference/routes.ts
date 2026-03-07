import type { ReferenceListResponse } from "@/sdk/model";

/**
 * Deterministic route reference data for MSW/mock mode.
 * Matches the route IDs used in the shipment fixture data.
 */
export const mockRouteListResponse: ReferenceListResponse = {
  items: [
    { id: "route_air_sea_hybrid_1", name: "Air-Sea Hybrid Route 1", code: null },
    { id: "route_asia_mexico_1", name: "Asia-Mexico Route 1", code: null },
    { id: "route_asia_us_1", name: "Asia-US Route 1", code: null },
    { id: "route_greatlakes_inland_1", name: "Great Lakes Inland Route 1", code: null },
    { id: "route_gulf_us_east_1", name: "Gulf-US East Route 1", code: null },
    { id: "route_hormuz_alt_1", name: "Hormuz Diversion Route 1", code: null },
    { id: "route_pacific_1", name: "Pacific Route 1", code: null },
    { id: "route_panama_priority_1", name: "Panama Priority Route 1", code: null },
    { id: "route_suez_alt_cape_1", name: "Suez Alternate Cape Route 1", code: null },
    { id: "route_transpacific_north_1", name: "Transpacific North Route 1", code: null },
    { id: "route_transpacific_south_1", name: "Transpacific South Route 1", code: null },
    { id: "route_westcoast_rail_bridge_1", name: "West Coast Rail Bridge Route 1", code: null },
  ],
  total: 12,
};
