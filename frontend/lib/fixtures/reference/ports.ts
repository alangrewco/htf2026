import type { ReferenceListResponse } from "@/sdk/model";

/**
 * Deterministic port reference data for MSW/mock mode.
 * Matches the port IDs used in the shipment fixture data.
 */
export const mockPortListResponse: ReferenceListResponse = {
  items: [
    { id: "PORT-CN-SZX", name: "Shenzhen", code: "SZX" },
    { id: "PORT-US-HOU", name: "Houston, TX", code: "HOU" },
    { id: "PORT-US-LGB", name: "Long Beach, CA", code: "LGB" },
    { id: "PORT-NL-RTM", name: "Rotterdam", code: "RTM" },
    { id: "PORT-US-EWR", name: "Newark, NJ", code: "EWR" },
    { id: "PORT-TW-TPE", name: "Taipei", code: "TPE" },
    { id: "PORT-US-LAX", name: "Los Angeles, CA", code: "LAX" },
    { id: "PORT-JP-OSA", name: "Osaka", code: "OSA" },
    { id: "PORT-US-SEA", name: "Seattle, WA", code: "SEA" },
    { id: "PORT-SG-SIN", name: "Singapore", code: "SIN" },
    { id: "PORT-US-SAV", name: "Savannah, GA", code: "SAV" },
    { id: "PORT-MX-MTY", name: "Monterrey", code: "MTY" },
    { id: "PORT-US-DAL", name: "Dallas, TX", code: "DAL" },
  ],
  total: 13,
};
