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

export interface RouteNode {
  lat: number;
  lng: number;
  isPort?: boolean;
  portName?: string;
}

export const ROUTE_PATHS: Record<string, RouteNode[]> = {
  route_air_sea_hybrid_1: [
    { lat: 22.50, lng: 113.88, isPort: true, portName: "Port of Shenzhen" },
    { lat: 20.00, lng: 115.00 },
    { lat: 1.25, lng: 104.00 },
    { lat: 5.00, lng: 80.00 },
    { lat: 15.00, lng: 65.00 },
    { lat: 25.00, lng: 55.05, isPort: true, portName: "Jebel Ali Port" },
    { lat: 35.00, lng: 45.00 },
    { lat: 45.00, lng: 25.00 },
    { lat: 50.03, lng: 8.57, isPort: true, portName: "Frankfurt Airport" },
  ],
  route_asia_mexico_1: [
    { lat: 31.22, lng: 121.48, isPort: true, portName: "Port of Shanghai" },
    { lat: 30.00, lng: 130.00 },
    { lat: 35.00, lng: 160.00 },
    { lat: 35.00, lng: -160.00 },
    { lat: 25.00, lng: -120.00 },
    { lat: 19.06, lng: -104.32, isPort: true, portName: "Port of Manzanillo" },
  ],
  route_asia_us_1: [
    { lat: 29.88, lng: 121.82, isPort: true, portName: "Port of Ningbo" },
    { lat: 30.00, lng: 130.00 },
    { lat: 40.00, lng: 170.00 },
    { lat: 45.00, lng: -160.00 },
    { lat: 40.00, lng: -130.00 },
    { lat: 33.74, lng: -118.26, isPort: true, portName: "Port of Los Angeles" },
  ],
  route_greatlakes_inland_1: [
    { lat: 45.50, lng: -73.57, isPort: true, portName: "Port of Montreal" },
    { lat: 44.20, lng: -76.50 },
    { lat: 43.60, lng: -78.00 },
    { lat: 43.00, lng: -79.20 },
    { lat: 42.20, lng: -81.50 },
    { lat: 42.10, lng: -83.10 },
    { lat: 44.50, lng: -82.50 },
    { lat: 45.80, lng: -84.70 },
    { lat: 44.00, lng: -87.00 },
    { lat: 41.88, lng: -87.63, isPort: true, portName: "Port of Chicago" },
  ],
  route_gulf_us_east_1: [
    { lat: 29.75, lng: -95.36, isPort: true, portName: "Port of Houston" },
    { lat: 26.00, lng: -90.00 },
    { lat: 24.50, lng: -81.00 },
    { lat: 30.00, lng: -79.00 },
    { lat: 35.00, lng: -74.00 },
    { lat: 40.71, lng: -74.01, isPort: true, portName: "Port of New York" },
  ],
  route_hormuz_alt_1: [
    { lat: 25.17, lng: 56.36, isPort: true, portName: "Port of Fujairah" },
    { lat: 24.00, lng: 59.00 },
    { lat: 20.00, lng: 65.00 },
    { lat: 18.94, lng: 72.84, isPort: true, portName: "Port of Mumbai" },
  ],
  route_pacific_1: [
    { lat: -33.86, lng: 151.21, isPort: true, portName: "Port of Sydney" },
    { lat: -20.00, lng: 155.00 },
    { lat: -10.00, lng: 153.00 },
    { lat: 15.00, lng: 140.00 },
    { lat: 35.62, lng: 139.77, isPort: true, portName: "Port of Tokyo" },
  ],
  route_panama_priority_1: [
    { lat: 51.95, lng: 4.14, isPort: true, portName: "Port of Rotterdam" },
    { lat: 50.00, lng: -2.00 },
    { lat: 35.00, lng: -30.00 },
    { lat: 15.00, lng: -70.00 },
    { lat: 9.10, lng: -79.70, isPort: true, portName: "Panama Canal" },
    { lat: 0.00, lng: -85.00 },
    { lat: -15.00, lng: -80.00 },
    { lat: -33.03, lng: -71.63, isPort: true, portName: "Port of Valparaiso" },
  ],
  route_suez_alt_cape_1: [
    { lat: 1.26, lng: 103.82, isPort: true, portName: "Port of Singapore" },
    { lat: -10.00, lng: 80.00 },
    { lat: -25.00, lng: 55.00 },
    { lat: -35.00, lng: 20.00, isPort: true, portName: "Cape of Good Hope" },
    { lat: -20.00, lng: 0.00 },
    { lat: 20.00, lng: -20.00 },
    { lat: 45.00, lng: -10.00 },
    { lat: 50.00, lng: -2.00 },
    { lat: 51.95, lng: 4.14, isPort: true, portName: "Port of Rotterdam" },
  ],
  route_transpacific_north_1: [
    { lat: 35.45, lng: 139.67, isPort: true, portName: "Port of Yokohama" },
    { lat: 45.00, lng: 160.00 },
    { lat: 50.00, lng: -160.00 },
    { lat: 48.00, lng: -130.00 },
    { lat: 47.60, lng: -122.33, isPort: true, portName: "Port of Seattle" },
  ],
  route_transpacific_south_1: [
    { lat: 10.76, lng: 106.66, isPort: true, portName: "Port of Ho Chi Minh City" },
    { lat: 15.00, lng: 115.00 },
    { lat: 20.00, lng: 130.00 },
    { lat: 25.00, lng: 160.00 },
    { lat: 25.00, lng: -160.00 },
    { lat: 30.00, lng: -130.00 },
    { lat: 33.75, lng: -118.21, isPort: true, portName: "Port of Long Beach" },
  ],
  route_westcoast_rail_bridge_1: [
    { lat: 35.10, lng: 129.04, isPort: true, portName: "Port of Busan" },
    { lat: 45.00, lng: 170.00 },
    { lat: 50.00, lng: -150.00 },
    { lat: 49.28, lng: -123.12, isPort: true, portName: "Port of Vancouver" },
    { lat: 49.00, lng: -110.00 },
    { lat: 45.00, lng: -95.00 },
    { lat: 41.88, lng: -87.63, isPort: true, portName: "Chicago Rail Hub" },
  ],
};
