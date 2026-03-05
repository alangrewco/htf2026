import type { SupplierListResponse } from "@/sdk/model";

export const mockSupplierListResponse: SupplierListResponse = {
  items: [
    {
      id: "sup-1",
      supplier_code: "SUP-001",
      name: "GlobalTech Electronics",
      country: "China",
      contact_email: "logistics@globaltech.com",
      status: "active",
      created_at: "2026-01-02T10:00:00Z",
      updated_at: "2026-03-03T10:00:00Z",
    },
    {
      id: "sup-2",
      supplier_code: "SUP-002",
      name: "ElectroParts Inc.",
      country: "United States",
      contact_email: "procurement@electroparts.com",
      status: "active",
      created_at: "2026-01-05T10:00:00Z",
      updated_at: "2026-03-03T12:10:00Z",
    },
    {
      id: "sup-3",
      supplier_code: "SUP-003",
      name: "EuroSteel GmbH",
      country: "Germany",
      contact_email: "sales@eurosteel.de",
      status: "active",
      created_at: "2026-01-06T10:00:00Z",
      updated_at: "2026-03-03T13:00:00Z",
    },
    {
      id: "sup-4",
      supplier_code: "SUP-004",
      name: "NipponCap Ltd.",
      country: "Japan",
      contact_email: "sales@nipponcap.jp",
      status: "active",
      created_at: "2026-01-08T10:00:00Z",
      updated_at: "2026-03-03T14:05:00Z",
    },
    {
      id: "sup-5",
      supplier_code: "SUP-005",
      name: "TaiwanSemi Corp.",
      country: "Taiwan",
      contact_email: "sales@taiwansemi.com",
      status: "active",
      created_at: "2026-01-10T10:00:00Z",
      updated_at: "2026-03-04T08:45:00Z",
    },
    {
      id: "sup-6",
      supplier_code: "SUP-006",
      name: "CorningSG Pte.",
      country: "Singapore",
      contact_email: "ops@corningsg.com",
      status: "active",
      created_at: "2026-01-11T10:00:00Z",
      updated_at: "2026-03-04T08:55:00Z",
    },
    {
      id: "sup-7",
      supplier_code: "SUP-007",
      name: "USMetals Corp.",
      country: "United States",
      contact_email: "sales@usmetals.com",
      status: "active",
      created_at: "2026-01-13T10:00:00Z",
      updated_at: "2026-03-04T09:05:00Z",
    },
  ],
  total: 7,
};

export type SupplierMetrics = {
  region: string;
  riskRating: "low" | "medium" | "high";
  activeShipments: number;
  plannedShipments: number;
  recurringShipments: number;
  skus: string[];
};

export const supplierMetricsById: Record<string, SupplierMetrics> = {
  "sup-1": {
    region: "Asia Pacific",
    riskRating: "high",
    activeShipments: 3,
    plannedShipments: 2,
    recurringShipments: 1,
    skus: ["SKU-101", "SKU-102", "SKU-306"],
  },
  "sup-2": {
    region: "North America",
    riskRating: "low",
    activeShipments: 1,
    plannedShipments: 1,
    recurringShipments: 2,
    skus: ["SKU-101", "SKU-456"],
  },
  "sup-3": {
    region: "Europe",
    riskRating: "medium",
    activeShipments: 2,
    plannedShipments: 1,
    recurringShipments: 1,
    skus: ["SKU-203", "SKU-204"],
  },
  "sup-4": {
    region: "Asia Pacific",
    riskRating: "high",
    activeShipments: 1,
    plannedShipments: 1,
    recurringShipments: 0,
    skus: ["SKU-305"],
  },
  "sup-5": {
    region: "Asia Pacific",
    riskRating: "medium",
    activeShipments: 2,
    plannedShipments: 0,
    recurringShipments: 1,
    skus: ["SKU-102", "SKU-306"],
  },
  "sup-6": {
    region: "Asia Pacific",
    riskRating: "low",
    activeShipments: 0,
    plannedShipments: 1,
    recurringShipments: 1,
    skus: ["SKU-407"],
  },
  "sup-7": {
    region: "North America",
    riskRating: "low",
    activeShipments: 1,
    plannedShipments: 0,
    recurringShipments: 2,
    skus: ["SKU-203", "SKU-510"],
  },
};
