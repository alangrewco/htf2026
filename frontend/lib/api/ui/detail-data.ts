/**
 * Case 2 — UI-only detail data for SKU / Shipment / Supplier modals.
 *
 * No backend endpoint exists for drill-down detail views yet.
 * All data lives locally; migrate to Case 1 once backend adds
 * the corresponding detail endpoints (tracked in TODO.md).
 */

// ── SKU Detail ───────────────────────────────────────────

export type SKUDetail = {
  id: string;
  quantityOnHand: number;
  unitCost: number;
  vendor: string;
  deliveryDate: string;
  lastOrderDate: string;
  leadTimeDays: number;
  specifications: {
    dimensions: string;
    weight: string;
    material: string;
    operatingTemp: string;
    compliance: string[];
  };
  recentOrders: {
    orderId: string;
    date: string;
    quantity: number;
    status: "fulfilled" | "pending" | "in-production";
  }[];
};

export const skuDetailById: Record<string, SKUDetail> = {
  "SKU-101": {
    id: "SKU-101",
    quantityOnHand: 2_340,
    unitCost: 24.5,
    vendor: "GlobalTech Electronics",
    deliveryDate: "2026-03-28",
    lastOrderDate: "2026-02-15",
    leadTimeDays: 42,
    specifications: {
      dimensions: "120 × 45 × 8 mm",
      weight: "38 g",
      material: "Aluminium / FR-4 PCB",
      operatingTemp: "-20 °C to 85 °C",
      compliance: ["RoHS", "CE", "UL Listed"],
    },
    recentOrders: [
      { orderId: "PO-8821", date: "2026-02-15", quantity: 5_000, status: "in-production" },
      { orderId: "PO-8760", date: "2026-01-20", quantity: 3_000, status: "fulfilled" },
    ],
  },
  "SKU-102": {
    id: "SKU-102",
    quantityOnHand: 1_120,
    unitCost: 18.75,
    vendor: "ShenzhenChip Co.",
    deliveryDate: "2026-03-22",
    lastOrderDate: "2026-02-10",
    leadTimeDays: 38,
    specifications: {
      dimensions: "32 × 32 × 4 mm",
      weight: "12 g",
      material: "Silicon / BGA Package",
      operatingTemp: "-40 °C to 105 °C",
      compliance: ["RoHS", "AEC-Q100"],
    },
    recentOrders: [
      { orderId: "PO-8805", date: "2026-02-10", quantity: 2_500, status: "in-production" },
      { orderId: "PO-8712", date: "2026-01-05", quantity: 1_800, status: "fulfilled" },
    ],
  },
  "SKU-203": {
    id: "SKU-203",
    quantityOnHand: 8_500,
    unitCost: 3.2,
    vendor: "EuroSteel GmbH",
    deliveryDate: "2026-03-18",
    lastOrderDate: "2026-02-01",
    leadTimeDays: 28,
    specifications: {
      dimensions: "200 × 50 × 3 mm",
      weight: "245 g",
      material: "Galvanized Steel",
      operatingTemp: "-30 °C to 200 °C",
      compliance: ["ISO 9001", "EN 1090"],
    },
    recentOrders: [
      { orderId: "PO-8790", date: "2026-02-01", quantity: 10_000, status: "fulfilled" },
    ],
  },
  "SKU-204": {
    id: "SKU-204",
    quantityOnHand: 4_200,
    unitCost: 7.8,
    vendor: "AluPrime Manufacturing",
    deliveryDate: "2026-03-25",
    lastOrderDate: "2026-02-05",
    leadTimeDays: 35,
    specifications: {
      dimensions: "80 × 80 × 25 mm",
      weight: "120 g",
      material: "CNC Aluminium 6063-T5",
      operatingTemp: "-40 °C to 150 °C",
      compliance: ["RoHS", "REACH"],
    },
    recentOrders: [
      { orderId: "PO-8798", date: "2026-02-05", quantity: 6_000, status: "pending" },
    ],
  },
  "SKU-305": {
    id: "SKU-305",
    quantityOnHand: 45_000,
    unitCost: 0.48,
    vendor: "NipponCap Ltd.",
    deliveryDate: "2026-04-05",
    lastOrderDate: "2026-03-01",
    leadTimeDays: 30,
    specifications: {
      dimensions: "3.2 × 1.6 × 1.2 mm",
      weight: "0.1 g",
      material: "X7R Ceramic",
      operatingTemp: "-55 °C to 125 °C",
      compliance: ["AEC-Q200", "RoHS"],
    },
    recentOrders: [
      { orderId: "PO-8850", date: "2026-03-01", quantity: 50_000, status: "in-production" },
    ],
  },
  "SKU-306": {
    id: "SKU-306",
    quantityOnHand: 12_000,
    unitCost: 1.95,
    vendor: "TaiwanSemi Corp.",
    deliveryDate: "2026-03-20",
    lastOrderDate: "2026-02-18",
    leadTimeDays: 26,
    specifications: {
      dimensions: "5 × 5 × 0.9 mm",
      weight: "0.3 g",
      material: "Silicon / QFN Package",
      operatingTemp: "-40 °C to 125 °C",
      compliance: ["RoHS", "REACH"],
    },
    recentOrders: [
      { orderId: "PO-8830", date: "2026-02-18", quantity: 15_000, status: "fulfilled" },
    ],
  },
  "SKU-407": {
    id: "SKU-407",
    quantityOnHand: 620,
    unitCost: 45.0,
    vendor: "CorningSG Pte.",
    deliveryDate: "2026-04-12",
    lastOrderDate: "2026-03-01",
    leadTimeDays: 40,
    specifications: {
      dimensions: "10 m × 2.5 mm diameter",
      weight: "85 g",
      material: "Single-mode Glass Fiber / PVC Jacket",
      operatingTemp: "-20 °C to 70 °C",
      compliance: ["IEC 60794", "RoHS"],
    },
    recentOrders: [
      { orderId: "PO-8855", date: "2026-03-01", quantity: 800, status: "pending" },
    ],
  },
  "SKU-408": {
    id: "SKU-408",
    quantityOnHand: 3_200,
    unitCost: 2.1,
    vendor: "FlexSeal Industries",
    deliveryDate: "2026-03-10",
    lastOrderDate: "2026-02-15",
    leadTimeDays: 14,
    specifications: {
      dimensions: "Assorted (set of 12)",
      weight: "180 g",
      material: "EPDM / Silicone Rubber",
      operatingTemp: "-50 °C to 230 °C",
      compliance: ["FDA 21 CFR", "RoHS"],
    },
    recentOrders: [
      { orderId: "PO-8815", date: "2026-02-15", quantity: 5_000, status: "fulfilled" },
    ],
  },
  "SKU-456": {
    id: "SKU-456",
    quantityOnHand: 780,
    unitCost: 32.0,
    vendor: "PCBWorld Inc.",
    deliveryDate: "2026-03-20",
    lastOrderDate: "2026-02-09",
    leadTimeDays: 32,
    specifications: {
      dimensions: "150 × 100 × 1.6 mm",
      weight: "55 g",
      material: "FR-4 / ENIG Finish / 6-Layer",
      operatingTemp: "-20 °C to 100 °C",
      compliance: ["IPC-A-610 Class 2", "RoHS"],
    },
    recentOrders: [
      { orderId: "PO-8801", date: "2026-02-09", quantity: 1_000, status: "fulfilled" },
    ],
  },
  "SKU-510": {
    id: "SKU-510",
    quantityOnHand: 15_000,
    unitCost: 0.85,
    vendor: "BoltCo Supply",
    deliveryDate: "2026-03-05",
    lastOrderDate: "2026-02-20",
    leadTimeDays: 10,
    specifications: {
      dimensions: "M4 × 16 mm (assorted)",
      weight: "350 g (kit)",
      material: "304 Stainless Steel",
      operatingTemp: "-80 °C to 400 °C",
      compliance: ["ISO 3506", "RoHS"],
    },
    recentOrders: [
      { orderId: "PO-8840", date: "2026-02-20", quantity: 20_000, status: "fulfilled" },
    ],
  },
};

// ── Shipment Detail ──────────────────────────────────────

export type ShipmentDetail = {
  id: string;
  containerType: string;
  totalWeight: string;
  declaredValue: string;
  customsStatus: "cleared" | "pending" | "held";
  documents: string[];
  trackingEvents: {
    date: string;
    location: string;
    event: string;
  }[];
};

export const shipmentDetailById: Record<string, ShipmentDetail> = {
  "SH-2048": {
    id: "SH-2048",
    containerType: "40' High-Cube Reefer",
    totalWeight: "18,200 kg",
    declaredValue: "$482,000",
    customsStatus: "pending",
    documents: ["Bill of Lading", "Commercial Invoice", "Packing List", "Certificate of Origin"],
    trackingEvents: [
      { date: "2026-03-04", location: "Mid-Pacific", event: "Vessel delayed — weather advisory" },
      { date: "2026-03-01", location: "Shanghai, CN", event: "Departed port of loading" },
      { date: "2026-02-28", location: "Shanghai, CN", event: "Customs cleared — export" },
      { date: "2026-02-25", location: "Shenzhen, CN", event: "Container loaded" },
      { date: "2026-02-22", location: "Shenzhen, CN", event: "Cargo received at warehouse" },
    ],
  },
  "SH-3021": {
    id: "SH-3021",
    containerType: "20' Standard Dry",
    totalWeight: "8,400 kg",
    declaredValue: "$215,000",
    customsStatus: "pending",
    documents: ["Bill of Lading", "Commercial Invoice", "Packing List"],
    trackingEvents: [
      { date: "2026-03-04", location: "East China Sea", event: "In transit — schedule at risk" },
      { date: "2026-02-28", location: "Shenzhen, CN", event: "Departed port of loading" },
      { date: "2026-02-26", location: "Shenzhen, CN", event: "Customs cleared — export" },
      { date: "2026-02-24", location: "Shenzhen, CN", event: "Container loaded" },
    ],
  },
  "SH-1002": {
    id: "SH-1002",
    containerType: "40' Standard Dry",
    totalWeight: "22,100 kg",
    declaredValue: "$310,000",
    customsStatus: "cleared",
    documents: ["Bill of Lading", "Commercial Invoice", "Packing List", "EUR.1 Certificate"],
    trackingEvents: [
      { date: "2026-03-04", location: "Mid-Atlantic", event: "In transit — on schedule" },
      { date: "2026-02-28", location: "Rotterdam, NL", event: "Departed port of loading" },
      { date: "2026-02-26", location: "Rotterdam, NL", event: "Customs cleared — export" },
      { date: "2026-02-22", location: "Rotterdam, NL", event: "Container loaded" },
      { date: "2026-02-18", location: "Duisburg, DE", event: "Cargo received at inland depot" },
    ],
  },
  "SH-2055": {
    id: "SH-2055",
    containerType: "20' Standard Dry",
    totalWeight: "6,800 kg",
    declaredValue: "$178,000",
    customsStatus: "cleared",
    documents: ["Bill of Lading", "Commercial Invoice", "Packing List"],
    trackingEvents: [
      { date: "2026-03-04", location: "Pacific Ocean", event: "In transit — on schedule" },
      { date: "2026-03-01", location: "Taipei, TW", event: "Departed port of loading" },
      { date: "2026-02-28", location: "Taipei, TW", event: "Customs cleared — export" },
      { date: "2026-02-26", location: "Taipei, TW", event: "Container loaded" },
    ],
  },
  "SH-4010": {
    id: "SH-4010",
    containerType: "20' Standard Dry",
    totalWeight: "4,200 kg",
    declaredValue: "$92,000",
    customsStatus: "pending",
    documents: ["Booking Confirmation", "Proforma Invoice"],
    trackingEvents: [
      { date: "2026-03-04", location: "Osaka, JP", event: "Booking confirmed — awaiting pickup" },
      { date: "2026-03-01", location: "Osaka, JP", event: "Shipment planned" },
    ],
  },
  "SH-5001": {
    id: "SH-5001",
    containerType: "20' Standard Dry",
    totalWeight: "3,100 kg",
    declaredValue: "$68,000",
    customsStatus: "pending",
    documents: ["Booking Confirmation"],
    trackingEvents: [
      { date: "2026-03-04", location: "Singapore", event: "Booking confirmed — pickup scheduled" },
      { date: "2026-03-01", location: "Singapore", event: "Shipment planned" },
    ],
  },
  "SH-6002": {
    id: "SH-6002",
    containerType: "LTL Truck",
    totalWeight: "1,800 kg",
    declaredValue: "$24,000",
    customsStatus: "cleared",
    documents: ["Bill of Lading", "Commercial Invoice", "USMCA Certificate"],
    trackingEvents: [
      { date: "2026-02-28", location: "Dallas, TX", event: "Delivered — signed by receiver" },
      { date: "2026-02-27", location: "Laredo, TX", event: "US Customs cleared" },
      { date: "2026-02-26", location: "Laredo, TX", event: "Cross-border — Mexico to US" },
      { date: "2026-02-25", location: "Monterrey, MX", event: "Departed warehouse" },
      { date: "2026-02-24", location: "Monterrey, MX", event: "Cargo loaded" },
    ],
  },
};

// ── Supplier Detail ──────────────────────────────────────

export type SupplierDetail = {
  id: string;
  contactPerson: string;
  phone: string;
  contractTerms: string;
  onTimeDeliveryRate: number;
  qualityScore: number;
  certifications: string[];
  recentOrders: {
    orderId: string;
    date: string;
    skus: string[];
    value: string;
    status: "delivered" | "in-transit" | "pending";
  }[];
};

export const supplierDetailById: Record<string, SupplierDetail> = {
  "sup-1": {
    id: "sup-1",
    contactPerson: "Wei Zhang",
    phone: "+86 755 8888 1234",
    contractTerms: "Net 60 · FOB Shenzhen",
    onTimeDeliveryRate: 72,
    qualityScore: 85,
    certifications: ["ISO 9001:2015", "ISO 14001", "IATF 16949"],
    recentOrders: [
      { orderId: "PO-8821", date: "2026-02-15", skus: ["SKU-101"], value: "$122,500", status: "in-transit" },
      { orderId: "PO-8805", date: "2026-02-10", skus: ["SKU-102"], value: "$46,875", status: "in-transit" },
      { orderId: "PO-8760", date: "2026-01-20", skus: ["SKU-101"], value: "$73,500", status: "delivered" },
    ],
  },
  "sup-2": {
    id: "sup-2",
    contactPerson: "Sarah Chen",
    phone: "+1 408 555 0199",
    contractTerms: "Net 30 · DDP Los Angeles",
    onTimeDeliveryRate: 94,
    qualityScore: 92,
    certifications: ["ISO 9001:2015", "AS9100D"],
    recentOrders: [
      { orderId: "PO-8801", date: "2026-02-09", skus: ["SKU-456"], value: "$32,000", status: "delivered" },
    ],
  },
  "sup-3": {
    id: "sup-3",
    contactPerson: "Hans Müller",
    phone: "+49 211 555 0345",
    contractTerms: "Net 45 · CIF Newark",
    onTimeDeliveryRate: 88,
    qualityScore: 91,
    certifications: ["ISO 9001:2015", "EN 1090-1", "ISO 14001"],
    recentOrders: [
      { orderId: "PO-8790", date: "2026-02-01", skus: ["SKU-203", "SKU-204"], value: "$54,000", status: "in-transit" },
    ],
  },
  "sup-4": {
    id: "sup-4",
    contactPerson: "Takeshi Yamamoto",
    phone: "+81 6 5555 0678",
    contractTerms: "Net 30 · FOB Osaka",
    onTimeDeliveryRate: 82,
    qualityScore: 96,
    certifications: ["ISO 9001:2015", "AEC-Q200 Certified"],
    recentOrders: [
      { orderId: "PO-8850", date: "2026-03-01", skus: ["SKU-305"], value: "$24,000", status: "pending" },
    ],
  },
  "sup-5": {
    id: "sup-5",
    contactPerson: "Kevin Lin",
    phone: "+886 2 5555 0890",
    contractTerms: "Net 45 · FOB Taipei",
    onTimeDeliveryRate: 78,
    qualityScore: 89,
    certifications: ["ISO 9001:2015", "IATF 16949"],
    recentOrders: [
      { orderId: "PO-8830", date: "2026-02-18", skus: ["SKU-306"], value: "$29,250", status: "delivered" },
    ],
  },
  "sup-6": {
    id: "sup-6",
    contactPerson: "Rachel Tan",
    phone: "+65 6555 0123",
    contractTerms: "Net 30 · CIF Savannah",
    onTimeDeliveryRate: 91,
    qualityScore: 88,
    certifications: ["ISO 9001:2015", "IEC 60794"],
    recentOrders: [
      { orderId: "PO-8855", date: "2026-03-01", skus: ["SKU-407"], value: "$36,000", status: "pending" },
    ],
  },
  "sup-7": {
    id: "sup-7",
    contactPerson: "Mike Johnson",
    phone: "+1 214 555 0456",
    contractTerms: "Net 15 · FCA Dallas",
    onTimeDeliveryRate: 96,
    qualityScore: 87,
    certifications: ["ISO 9001:2015", "ISO 3506"],
    recentOrders: [
      { orderId: "PO-8840", date: "2026-02-20", skus: ["SKU-510"], value: "$17,000", status: "delivered" },
      { orderId: "PO-8815", date: "2026-02-15", skus: ["SKU-408"], value: "$10,500", status: "delivered" },
    ],
  },
};

// ── Metrics from Fixtures ────────────────────────────────

export type SKUMetrics = {
  riskScore: number;
  riskLevel: "critical" | "high" | "medium" | "low";
  revenue: number;
  topSuppliers: string[];
  topShipments: string[];
  category: string;
};

export const skuMetricsById: Record<string, SKUMetrics> = {
  "SKU-101": {
    riskScore: 92,
    riskLevel: "critical",
    revenue: 340_000,
    topSuppliers: ["GlobalTech", "ElectroParts", "ShenzhenLED"],
    topShipments: ["SH-2048", "SH-2055", "SH-2061"],
    category: "Electronics",
  },
  "SKU-102": {
    riskScore: 85,
    riskLevel: "critical",
    revenue: 280_000,
    topSuppliers: ["ShenzhenChip", "TaiwanSemi"],
    topShipments: ["SH-3021", "SH-3034"],
    category: "Electronics",
  },
  "SKU-203": {
    riskScore: 72,
    riskLevel: "high",
    revenue: 120_000,
    topSuppliers: ["EuroSteel", "USMetals"],
    topShipments: ["SH-1002", "SH-1015"],
    category: "Structural",
  },
  "SKU-204": {
    riskScore: 68,
    riskLevel: "high",
    revenue: 95_000,
    topSuppliers: ["EuroSteel", "AluPrime"],
    topShipments: ["SH-1002", "SH-1018"],
    category: "Thermal",
  },
  "SKU-305": {
    riskScore: 61,
    riskLevel: "medium",
    revenue: 75_000,
    topSuppliers: ["NipponCap"],
    topShipments: ["SH-4010", "SH-4012"],
    category: "Electronics",
  },
  "SKU-306": {
    riskScore: 55,
    riskLevel: "medium",
    revenue: 62_000,
    topSuppliers: ["TaiwanSemi", "TexasComp"],
    topShipments: ["SH-3034", "SH-3040"],
    category: "Electronics",
  },
  "SKU-407": {
    riskScore: 42,
    riskLevel: "medium",
    revenue: 48_000,
    topSuppliers: ["CorningSG", "FujiLink"],
    topShipments: ["SH-5001"],
    category: "Connectivity",
  },
  "SKU-408": {
    riskScore: 28,
    riskLevel: "low",
    revenue: 18_000,
    topSuppliers: ["FlexSeal", "USRubber"],
    topShipments: ["SH-6002"],
    category: "Sealing",
  },
  "SKU-456": {
    riskScore: 15,
    riskLevel: "low",
    revenue: 32_000,
    topSuppliers: ["ElectroParts", "PCBWorld"],
    topShipments: ["SH-2055"],
    category: "Electronics",
  },
  "SKU-510": {
    riskScore: 8,
    riskLevel: "low",
    revenue: 12_000,
    topSuppliers: ["USMetals", "BoltCo"],
    topShipments: ["SH-6003"],
    category: "Hardware",
  },
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

export type ShipmentDetails = {
  origin: string;
  destination: string;
  carrier: string;
  etaLabel: string;
};

export const shipmentDetailsByCode: Record<string, ShipmentDetails> = {
  "SH-2048": {
    origin: "Shenzhen, CN",
    destination: "Houston, TX",
    carrier: "Maersk",
    etaLabel: "Mar 28 (delayed from Mar 14)",
  },
  "SH-3021": {
    origin: "Shenzhen, CN",
    destination: "Long Beach, CA",
    carrier: "COSCO",
    etaLabel: "Mar 22 (at risk)",
  },
  "SH-1002": {
    origin: "Rotterdam, NL",
    destination: "Newark, NJ",
    carrier: "MSC",
    etaLabel: "Mar 18",
  },
  "SH-2055": {
    origin: "Taipei, TW",
    destination: "Los Angeles, CA",
    carrier: "Evergreen",
    etaLabel: "Mar 20",
  },
  "SH-4010": {
    origin: "Osaka, JP",
    destination: "Seattle, WA",
    carrier: "NYK Line",
    etaLabel: "Apr 5",
  },
  "SH-5001": {
    origin: "Singapore",
    destination: "Savannah, GA",
    carrier: "Hapag-Lloyd",
    etaLabel: "Apr 12",
  },
  "SH-6002": {
    origin: "Monterrey, MX",
    destination: "Dallas, TX",
    carrier: "XPO Logistics",
    etaLabel: "Delivered Feb 28",
  },
};
