import useSwr from "swr";

export type GeoNode = {
    id: string;
    name: string;
    coordinates: [number, number]; // [longitude, latitude]
    status: "normal" | "warning" | "critical";
};

export type GeoRoute = {
    id: string;
    from: string; // GeoNode.id
    to: string;   // GeoNode.id
    status: "active" | "delayed" | "disrupted";
};

export type GeographicData = {
    nodes: GeoNode[];
    routes: GeoRoute[];
};

// Data aligned with the mockActionCards and mockLiveSignals in the local SWR backend
const mockGeoData: GeographicData = {
    nodes: [
        { id: "houston", name: "Port of Houston", coordinates: [-95.3698, 29.7604], status: "critical" }, // Strike
        { id: "shenzhen", name: "Shenzhen Port", coordinates: [114.0579, 22.5431], status: "warning" }, // Typhoon
        { id: "los_angeles", name: "Port of Los Angeles", coordinates: [-118.2437, 34.0522], status: "normal" }, // Reroute Option
        { id: "taipei", name: "Taipei (TaiwanSemi)", coordinates: [121.5654, 25.033], status: "normal" }, // Backup Supplier
        { id: "osaka", name: "Osaka (NipponCap)", coordinates: [135.5023, 34.6937], status: "warning" }, // Earthquake Prone
        { id: "new_york", name: "New York HQ", coordinates: [-74.006, 40.7128], status: "normal" },
        { id: "frankfurt", name: "Frankfurt (Steel)", coordinates: [8.6821, 50.1109], status: "warning" }, // EU Tariff
        { id: "chicago", name: "Chicago DC", coordinates: [-87.6298, 41.8781], status: "normal" }
    ],
    routes: [
        { id: "r1", from: "shenzhen", to: "houston", status: "disrupted" }, // Delay due to strike/typhoon
        { id: "r2", from: "shenzhen", to: "los_angeles", status: "delayed" }, // Rerouted
        { id: "r3", from: "taipei", to: "los_angeles", status: "active" }, // Backup Air Freight
        { id: "r4", from: "osaka", to: "chicago", status: "active" }, // NipponCap Flow
        { id: "r5", from: "frankfurt", to: "new_york", status: "active" }, // Steel Imports
        { id: "r6", from: "houston", to: "chicago", status: "delayed" }, // Inland Transport
        { id: "r7", from: "los_angeles", to: "chicago", status: "active" }
    ]
};

const getGeographicData = async (): Promise<GeographicData> => {
    return mockGeoData;
};

export const useGeographicData = () => {
    return useSwr(["mock", "geographic-data"], getGeographicData, {
        revalidateOnFocus: false,
    });
};
