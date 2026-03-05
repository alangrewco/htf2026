// ── KPI Data ──────────────────────────────────────────────
export const kpiData = {
  revenueAtRisk: 2_340_000,
  activeDisruptions: 7,
  affectedSKUs: 34,
  totalSKUs: 128,
};

// ── Live Signals ──────────────────────────────────────────
export type Signal = {
  id: string;
  title: string;
  source: string;
  type: "geopolitical" | "weather" | "financial" | "logistics" | "labor";
  timestamp: string;
  summary: string;
};

export const liveSignals: Signal[] = [
  {
    id: "sig-1",
    title: "Port of Houston Workers Strike Enters Week 3",
    source: "Reuters",
    type: "labor",
    timestamp: "2 min ago",
    summary:
      "Dockworkers union has rejected latest pay proposal. Ship handling degraded to ~1 vessel/day.",
  },
  {
    id: "sig-2",
    title: "Typhoon Warning Issued for South China Sea",
    source: "NOAA",
    type: "weather",
    timestamp: "18 min ago",
    summary:
      "Category 3 typhoon expected to impact Shenzhen port operations within 48 hours.",
  },
  {
    id: "sig-3",
    title: "EU Carbon Border Tax Takes Effect",
    source: "Financial Times",
    type: "financial",
    timestamp: "1 hr ago",
    summary:
      "New tariffs on carbon-intensive imports may increase costs for steel and aluminum SKUs by 8-12%.",
  },
  {
    id: "sig-4",
    title: "Red Sea Shipping Disruptions Continue",
    source: "Lloyd's List",
    type: "geopolitical",
    timestamp: "2 hr ago",
    summary:
      "Houthi attacks force continued rerouting via Cape of Good Hope, adding 10-14 days to Asia-Europe transit.",
  },
  {
    id: "sig-5",
    title: "Panama Canal Drought Restrictions Extended",
    source: "Canal Authority",
    type: "logistics",
    timestamp: "3 hr ago",
    summary:
      "Daily transit slots reduced to 24 from 36. Waiting times increased to 21 days on average.",
  },
  {
    id: "sig-6",
    title: "Bangladesh Garment Factory Closures",
    source: "AP News",
    type: "labor",
    timestamp: "5 hr ago",
    summary:
      "Political unrest leads to temporary factory shutdowns affecting textile supply.",
  },
];

// ── Action Cards ──────────────────────────────────────────
export type ActionCardType = "disruption" | "risk" | "autonomous";

export type ActionCard = {
  id: string;
  type: ActionCardType;
  title: string;
  category: string;
  impactTimeframe: string;
  affectedValue: number;
  affectedSKUs: number;
  summary: string;
  whatHappened: string[];
  howItAffects: string[];
  possibleActions: {
    label: string;
    description: string;
    costImpact: string;
    timeImpact: string;
    riskLevel: "low" | "medium" | "high";
    steps: string[];
  }[];
};

export const actionCards: ActionCard[] = [
  {
    id: "ac-1",
    type: "disruption",
    title: "Reroute Shipments from Port of Houston",
    category: "Port Strike",
    impactTimeframe: "Immediate — Est. 3 weeks",
    affectedValue: 890_000,
    affectedSKUs: 12,
    summary:
      "Active worker strike at Port of Houston is severely delaying shipments through the port.",
    whatHappened: [
      "Workers on strike at Port of Houston since Feb 15",
      "Ship handling rate degraded from 5 ships to 1 ship per day",
      "Strikes expected to continue for weeks (~April 1st)",
    ],
    howItAffects: [
      "LEDs shipped by Supplier GlobalTech planned to pass Port of Houston",
      "Calculated that strikes will delay shipment SH-2048 by 3 weeks",
      "12 SKUs with $890K total value at risk",
    ],
    possibleActions: [
      {
        label: "Do nothing",
        description: "Wait for strike resolution. Absorb delay.",
        costImpact: "$0 additional",
        timeImpact: "+3 weeks delay",
        riskLevel: "high",
        steps: [
          "Monitor strike status daily via Reuters alerts",
          "Notify downstream customers of potential 3-week delay",
          "Prepare contingency plan if strike extends past April 1",
        ],
      },
      {
        label: "Emergency shipment via Supplier ElectroParts",
        description: "Source LEDs from backup supplier at higher unit cost.",
        costImpact: "+$45,000",
        timeImpact: "5 days delivery",
        riskLevel: "low",
        steps: [
          "Contact ElectroParts procurement team for LED availability",
          "Issue emergency PO for 12 SKUs at agreed backup pricing",
          "Arrange expedited air freight from ElectroParts facility",
          "Update ERP system with new shipment tracking details",
          "Notify warehouse team of incoming shipment ETA",
        ],
      },
      {
        label: "Contact GlobalTech to reroute via Port of LA",
        description: "Reroute existing shipment to Port of Los Angeles.",
        costImpact: "+$12,000",
        timeImpact: "+5 days vs original",
        riskLevel: "medium",
        steps: [
          "Contact GlobalTech logistics coordinator",
          "Request shipment SH-2048 reroute to Port of Los Angeles",
          "Confirm additional freight charges and revised ETA",
          "Arrange inland transport from LA to Houston warehouse",
        ],
      },
    ],
  },
  {
    id: "ac-2",
    type: "disruption",
    title: "Typhoon Impact on Shenzhen Supplier",
    category: "Weather Event",
    impactTimeframe: "48 hours",
    affectedValue: 560_000,
    affectedSKUs: 8,
    summary:
      "Category 3 typhoon approaching Shenzhen could shut down port operations for up to 5 days.",
    whatHappened: [
      "Category 3 typhoon forming in South China Sea",
      "Expected landfall near Shenzhen within 48 hours",
      "Port authority issued preemptive shutdown advisory",
    ],
    howItAffects: [
      "Shipment SH-3021 containing microcontrollers at port awaiting load",
      "Potential 5-day port closure plus backlog clearing period",
      "8 SKUs dependent on Shenzhen sourcing affected",
    ],
    possibleActions: [
      {
        label: "Expedite loading before typhoon hits",
        description: "Coordinate with port to prioritize our shipment.",
        costImpact: "+$8,000 expedite fee",
        timeImpact: "No delay if loaded in time",
        riskLevel: "medium",
        steps: [
          "Contact Shenzhen port authority for priority loading slot",
          "Pay expedite fee to secure next available berth",
          "Coordinate with COSCO for accelerated vessel loading",
          "Confirm departure before typhoon arrival window",
        ],
      },
      {
        label: "Activate Taiwan backup supplier",
        description: "Source microcontrollers from secondary supplier.",
        costImpact: "+$22,000",
        timeImpact: "7 days delivery",
        riskLevel: "low",
        steps: [
          "Contact TaiwanSemi for microcontroller availability",
          "Issue PO for 8 affected SKUs at backup pricing",
          "Arrange shipment from Taipei facility via air freight",
          "Update supply chain records with new sourcing data",
          "Monitor original Shenzhen shipment for insurance claim",
        ],
      },
    ],
  },
  {
    id: "ac-3",
    type: "risk",
    title: "Diversify Steel Suppliers — EU Tariff Risk",
    category: "Regulatory",
    impactTimeframe: "Next 30 days",
    affectedValue: 340_000,
    affectedSKUs: 5,
    summary:
      "New EU carbon border tax increases costs on steel imports. Consider domestic sourcing alternatives.",
    whatHappened: [
      "EU Carbon Border Adjustment Mechanism (CBAM) took effect March 1",
      "Steel and aluminum imports face 8-12% surcharge",
      "Phase-in period extends through 2026",
    ],
    howItAffects: [
      "5 SKUs use imported steel components",
      "Unit costs projected to increase by ~10%",
      "Annual impact estimated at $340,000 if no action taken",
    ],
    possibleActions: [
      {
        label: "Source from domestic steel suppliers",
        description: "Shift to US-based steel suppliers to avoid tariff.",
        costImpact: "+3% unit cost",
        timeImpact: "2-4 weeks transition",
        riskLevel: "low",
        steps: [
          "Identify qualified US-based steel suppliers (USMetals, SteelCo)",
          "Request quotes and sample materials for qualification",
          "Run quality assurance tests on domestic steel samples",
          "Negotiate supply agreement with selected vendor",
          "Transition purchase orders over 2-4 week window",
        ],
      },
      {
        label: "Negotiate tariff pass-through with customers",
        description: "Adjust pricing to reflect increased input costs.",
        costImpact: "Revenue neutral",
        timeImpact: "1-2 weeks",
        riskLevel: "medium",
        steps: [
          "Prepare cost impact analysis for affected product lines",
          "Draft pricing adjustment proposals for key accounts",
          "Schedule calls with top 5 customers to discuss changes",
          "Update price lists and contracts with new terms",
        ],
      },
    ],
  },
  {
    id: "ac-4",
    type: "risk",
    title: "Reduce Single-Source Dependency: Capacitors",
    category: "Supply Concentration",
    impactTimeframe: "Next 60 days",
    affectedValue: 210_000,
    affectedSKUs: 3,
    summary:
      "3 SKUs depend on a single capacitor supplier. Onboard backup to reduce disruption risk.",
    whatHappened: [
      "Supplier NipponCap provides 100% of type-C capacitors",
      "No qualified backup supplier exists in current network",
      "NipponCap facility is in earthquake-prone Osaka region",
    ],
    howItAffects: [
      "If NipponCap has a disruption, 3 critical SKUs go offline",
      "Lead time for new supplier qualification: 45-60 days",
      "Revenue at risk: $210,000/month",
    ],
    possibleActions: [
      {
        label: "Begin onboarding TaiwanCap as secondary source",
        description: "Start qualification process for backup supplier.",
        costImpact: "$15,000 qualification cost",
        timeImpact: "60 days to qualify",
        riskLevel: "low",
        steps: [
          "Contact TaiwanCap for initial capability assessment",
          "Send technical specifications and quality requirements",
          "Request sample capacitors for engineering evaluation",
          "Schedule facility audit and qualification review",
          "Run 30-day parallel production trial",
          "Approve TaiwanCap as qualified secondary supplier",
        ],
      },
    ],
  },
  {
    id: "ac-5",
    type: "autonomous",
    title: "Auto-Reordered SKU-456 from Backup Supplier",
    category: "Inventory Management",
    impactTimeframe: "Completed",
    affectedValue: 18_000,
    affectedSKUs: 1,
    summary:
      "System detected low inventory for SKU-456 and automatically triggered reorder from qualified backup.",
    whatHappened: [
      "SKU-456 inventory dropped below safety stock threshold",
      "Primary supplier lead time exceeded reorder window",
      "Automated rule triggered backup supplier order",
    ],
    howItAffects: [
      "SKU-456 restocked via ElectroParts — arriving in 4 days",
      "No production disruption expected",
      "Cost premium of $2,100 vs primary supplier pricing",
    ],
    possibleActions: [
      {
        label: "Acknowledge",
        description: "Confirm automated action was appropriate.",
        costImpact: "$0",
        timeImpact: "None",
        riskLevel: "low",
        steps: [
          "Review automated reorder details and pricing",
          "Confirm receipt with ElectroParts shipping team",
          "Log action in supply chain audit trail",
        ],
      },
    ],
  },
  {
    id: "ac-6",
    type: "autonomous",
    title: "Preemptive Buffer Stock Adjustment for Q2",
    category: "Demand Planning",
    impactTimeframe: "Completed",
    affectedValue: 45_000,
    affectedSKUs: 6,
    summary:
      "AI detected seasonal demand spike pattern and increased buffer stock for 6 SKUs ahead of Q2.",
    whatHappened: [
      "Historical analysis shows 22% demand increase in Q2 for electronics",
      "Current buffer stock levels insufficient for projected demand",
      "System auto-adjusted safety stock levels for 6 SKUs",
    ],
    howItAffects: [
      "Buffer stock increased by 15% across 6 SKUs",
      "Additional inventory holding cost: $45,000",
      "Stockout risk reduced from 18% to 3%",
    ],
    possibleActions: [
      {
        label: "Approve adjustment",
        description: "Confirm the buffer stock increase.",
        costImpact: "$45,000 holding cost",
        timeImpact: "Already in effect",
        riskLevel: "low",
        steps: [
          "Review demand forecast model and assumptions",
          "Confirm buffer stock levels in warehouse management system",
          "Approve $45,000 additional holding cost allocation",
          "Set review checkpoint for end of Q2 to reassess",
        ],
      },
      {
        label: "Revert to original levels",
        description: "Cancel the buffer stock adjustment.",
        costImpact: "$0",
        timeImpact: "Immediate",
        riskLevel: "high",
        steps: [
          "Cancel pending restock orders for 6 affected SKUs",
          "Reset safety stock thresholds to pre-adjustment levels",
          "Accept increased stockout risk (18%) for Q2",
          "Notify operations team of revised inventory targets",
        ],
      },
    ],
  },
];

// ── SKUs ──────────────────────────────────────────────────
export type SKU = {
  id: string;
  name: string;
  category: string;
  riskScore: number; // 0-100
  riskLevel: "critical" | "high" | "medium" | "low";
  revenue: number;
  topSuppliers: string[];
  topShipments: string[];
};

export const skus: SKU[] = [
  {
    id: "SKU-101",
    name: "Industrial LED Module A",
    category: "Electronics",
    riskScore: 92,
    riskLevel: "critical",
    revenue: 340_000,
    topSuppliers: ["GlobalTech", "ElectroParts", "ShenzhenLED"],
    topShipments: ["SH-2048", "SH-2055", "SH-2061"],
  },
  {
    id: "SKU-102",
    name: "Microcontroller Unit B",
    category: "Electronics",
    riskScore: 85,
    riskLevel: "critical",
    revenue: 280_000,
    topSuppliers: ["ShenzhenChip", "TaiwanSemi"],
    topShipments: ["SH-3021", "SH-3034"],
  },
  {
    id: "SKU-203",
    name: "Steel Mounting Bracket",
    category: "Structural",
    riskScore: 72,
    riskLevel: "high",
    revenue: 120_000,
    topSuppliers: ["EuroSteel", "USMetals"],
    topShipments: ["SH-1002", "SH-1015"],
  },
  {
    id: "SKU-204",
    name: "Aluminum Heat Sink",
    category: "Thermal",
    riskScore: 68,
    riskLevel: "high",
    revenue: 95_000,
    topSuppliers: ["EuroSteel", "AluPrime"],
    topShipments: ["SH-1002", "SH-1018"],
  },
  {
    id: "SKU-305",
    name: "Type-C Ceramic Capacitor",
    category: "Electronics",
    riskScore: 61,
    riskLevel: "medium",
    revenue: 75_000,
    topSuppliers: ["NipponCap"],
    topShipments: ["SH-4010", "SH-4012"],
  },
  {
    id: "SKU-306",
    name: "Power Regulator IC",
    category: "Electronics",
    riskScore: 55,
    riskLevel: "medium",
    revenue: 62_000,
    topSuppliers: ["TaiwanSemi", "TexasComp"],
    topShipments: ["SH-3034", "SH-3040"],
  },
  {
    id: "SKU-407",
    name: "Fiber Optic Cable Assembly",
    category: "Connectivity",
    riskScore: 42,
    riskLevel: "medium",
    revenue: 48_000,
    topSuppliers: ["CorningSG", "FujiLink"],
    topShipments: ["SH-5001"],
  },
  {
    id: "SKU-408",
    name: "Rubber Gasket Set",
    category: "Sealing",
    riskScore: 28,
    riskLevel: "low",
    revenue: 18_000,
    topSuppliers: ["FlexSeal", "USRubber"],
    topShipments: ["SH-6002"],
  },
  {
    id: "SKU-456",
    name: "PCB Assembly Unit",
    category: "Electronics",
    riskScore: 15,
    riskLevel: "low",
    revenue: 32_000,
    topSuppliers: ["ElectroParts", "PCBWorld"],
    topShipments: ["SH-2055"],
  },
  {
    id: "SKU-510",
    name: "Stainless Steel Fastener Kit",
    category: "Hardware",
    riskScore: 8,
    riskLevel: "low",
    revenue: 12_000,
    topSuppliers: ["USMetals", "BoltCo"],
    topShipments: ["SH-6003"],
  },
];

// ── Shipments ─────────────────────────────────────────────
export type Shipment = {
  id: string;
  status: "in-transit" | "delayed" | "planned" | "delivered";
  origin: string;
  destination: string;
  carrier: string;
  eta: string;
  skus: string[];
};

export const shipments: Shipment[] = [
  {
    id: "SH-2048",
    status: "delayed",
    origin: "Shenzhen, CN",
    destination: "Houston, TX",
    carrier: "Maersk",
    eta: "Mar 28 (delayed from Mar 14)",
    skus: ["SKU-101", "SKU-102", "SKU-305"],
  },
  {
    id: "SH-3021",
    status: "delayed",
    origin: "Shenzhen, CN",
    destination: "Long Beach, CA",
    carrier: "COSCO",
    eta: "Mar 22 (at risk)",
    skus: ["SKU-102", "SKU-306"],
  },
  {
    id: "SH-1002",
    status: "in-transit",
    origin: "Rotterdam, NL",
    destination: "Newark, NJ",
    carrier: "MSC",
    eta: "Mar 18",
    skus: ["SKU-203", "SKU-204", "SKU-510"],
  },
  {
    id: "SH-2055",
    status: "in-transit",
    origin: "Taipei, TW",
    destination: "Los Angeles, CA",
    carrier: "Evergreen",
    eta: "Mar 20",
    skus: ["SKU-101", "SKU-456"],
  },
  {
    id: "SH-4010",
    status: "planned",
    origin: "Osaka, JP",
    destination: "Seattle, WA",
    carrier: "NYK Line",
    eta: "Apr 5",
    skus: ["SKU-305", "SKU-407"],
  },
  {
    id: "SH-5001",
    status: "planned",
    origin: "Singapore",
    destination: "Savannah, GA",
    carrier: "Hapag-Lloyd",
    eta: "Apr 12",
    skus: ["SKU-407"],
  },
  {
    id: "SH-6002",
    status: "delivered",
    origin: "Monterrey, MX",
    destination: "Dallas, TX",
    carrier: "XPO Logistics",
    eta: "Delivered Feb 28",
    skus: ["SKU-408"],
  },
];

// ── Suppliers ─────────────────────────────────────────────
export type Supplier = {
  id: string;
  name: string;
  region: string;
  riskRating: "low" | "medium" | "high";
  activeShipments: number;
  plannedShipments: number;
  recurringShipments: number;
  skus: string[];
};

export const suppliers: Supplier[] = [
  {
    id: "sup-1",
    name: "GlobalTech Electronics",
    region: "Asia Pacific",
    riskRating: "high",
    activeShipments: 3,
    plannedShipments: 2,
    recurringShipments: 1,
    skus: ["SKU-101", "SKU-102", "SKU-306"],
  },
  {
    id: "sup-2",
    name: "ElectroParts Inc.",
    region: "North America",
    riskRating: "low",
    activeShipments: 1,
    plannedShipments: 1,
    recurringShipments: 2,
    skus: ["SKU-101", "SKU-456"],
  },
  {
    id: "sup-3",
    name: "EuroSteel GmbH",
    region: "Europe",
    riskRating: "medium",
    activeShipments: 2,
    plannedShipments: 1,
    recurringShipments: 1,
    skus: ["SKU-203", "SKU-204"],
  },
  {
    id: "sup-4",
    name: "NipponCap Ltd.",
    region: "Asia Pacific",
    riskRating: "high",
    activeShipments: 1,
    plannedShipments: 1,
    recurringShipments: 0,
    skus: ["SKU-305"],
  },
  {
    id: "sup-5",
    name: "TaiwanSemi Corp.",
    region: "Asia Pacific",
    riskRating: "medium",
    activeShipments: 2,
    plannedShipments: 0,
    recurringShipments: 1,
    skus: ["SKU-102", "SKU-306"],
  },
  {
    id: "sup-6",
    name: "CorningSG Pte.",
    region: "Asia Pacific",
    riskRating: "low",
    activeShipments: 0,
    plannedShipments: 1,
    recurringShipments: 1,
    skus: ["SKU-407"],
  },
  {
    id: "sup-7",
    name: "USMetals Corp.",
    region: "North America",
    riskRating: "low",
    activeShipments: 1,
    plannedShipments: 0,
    recurringShipments: 2,
    skus: ["SKU-203", "SKU-510"],
  },
];
