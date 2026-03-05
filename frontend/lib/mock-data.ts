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

export type ExecutionStep = {
  id: string;
  type: "autonomous" | "semi-autonomous" | "manual";
  label: string;
  description: string;
  autonomousPreview?: string;
  draftContent?: { to: string; subject: string; body: string };
  manualInstruction?: string;
};

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
    executionSteps: ExecutionStep[];
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
        executionSteps: [
          {
            id: "es-1a",
            type: "autonomous",
            label: "Set up automated monitoring",
            description: "Configuring Reuters alert feed for Port of Houston strike updates.",
            autonomousPreview: "✅ Alert configured — you'll receive daily updates via email and dashboard notification. Current status: Strike ongoing, no negotiations scheduled.",
          },
          {
            id: "es-1b",
            type: "semi-autonomous",
            label: "Draft customer delay notification",
            description: "Preparing email to notify downstream customers of potential delay.",
            draftContent: {
              to: "key-accounts@customers.com",
              subject: "[Important] Potential 3-week delay on LED shipments — Port of Houston strike",
              body: "Dear Valued Customer,\n\nWe are writing to inform you of a potential delay affecting your upcoming LED module shipments. Due to the ongoing worker strike at the Port of Houston, shipments routed through this port may experience delays of up to 3 weeks.\n\nAffected orders: [Order numbers will be inserted]\nOriginal ETA: March 14, 2026\nRevised ETA: ~April 4, 2026\n\nWe are actively monitoring the situation and exploring alternative routing options. We will keep you updated as the situation evolves.\n\nPlease don't hesitate to reach out with any questions.\n\nBest regards,\nSupply Chain Operations Team",
            },
          },
          {
            id: "es-1c",
            type: "manual",
            label: "Prepare contingency plan",
            description: "Review and finalize contingency plan if strike extends past April 1.",
            manualInstruction: "Please review the contingency options document shared in your email and discuss with your operations team. Key decision points:\n\n1. At what point do we switch to backup suppliers?\n2. Should we pre-authorize emergency spending above $50K?\n3. Which customers get priority if partial stock arrives?\n\nOnce you've made these decisions, come back and confirm so I can update the contingency plan.",
          },
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
        executionSteps: [
          {
            id: "es-2a",
            type: "autonomous",
            label: "Check ElectroParts inventory",
            description: "Querying ElectroParts API for real-time LED module availability.",
            autonomousPreview: "✅ Inventory check complete — ElectroParts has 14 of 12 required SKUs in stock. Unit pricing confirmed at +18% premium ($45K total). Lead time: 2 days to ship.",
          },
          {
            id: "es-2b",
            type: "semi-autonomous",
            label: "Draft Emergency Purchase Order",
            description: "Preparing the emergency PO for your review before sending.",
            draftContent: {
              to: "procurement@electroparts.com",
              subject: "Emergency PO — 12 LED Module SKUs (Backup Order)",
              body: "Hi ElectroParts Procurement Team,\n\nWe need to place an emergency order for the following LED modules under our backup supply agreement (Contract #EP-2025-BK-114):\n\nSKUs: SKU-101 through SKU-112 (12 units)\nPricing: Per backup agreement (+18% premium)\nTotal estimated: $45,000\nShipping: Expedited air freight to Houston, TX warehouse\nRequired delivery: Within 5 business days\n\nPlease confirm availability and send the formal PO acknowledgment.\n\nRegards,\nProcurement Team",
            },
          },
          {
            id: "es-2c",
            type: "autonomous",
            label: "Arrange air freight booking",
            description: "Booking expedited air freight from ElectroParts facility to Houston.",
            autonomousPreview: "✅ Air freight booked with FedEx Priority — Pickup scheduled for tomorrow 8AM EST from ElectroParts facility (Newark, NJ). Tracking: FX-8847291. ETA: 2 business days.",
          },
          {
            id: "es-2d",
            type: "autonomous",
            label: "Update ERP system",
            description: "Updating shipment tracking and inventory records in ERP.",
            autonomousPreview: "✅ ERP updated — New shipment SH-EM-001 created. Tracking linked. Inventory forecast adjusted for 12 SKUs. Warehouse team auto-notified via system alert.",
          },
          {
            id: "es-2e",
            type: "manual",
            label: "Notify warehouse team",
            description: "Confirm warehouse readiness for incoming emergency shipment.",
            manualInstruction: "Please call the Houston warehouse manager (ext. 4502) to:\n\n1. Confirm receiving dock availability for the incoming air freight shipment (ETA: 2 days)\n2. Ensure QA inspection team is scheduled for the arrival date\n3. Pre-allocate bin locations for the 12 SKUs\n\nOnce confirmed, come back and let me know so I can finalize the logistics chain.",
          },
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
        executionSteps: [
          {
            id: "es-3a",
            type: "autonomous",
            label: "Analyze reroute options",
            description: "Checking vessel schedules and port availability for LA reroute.",
            autonomousPreview: "✅ Reroute analysis complete — Port of LA has capacity. Vessel MV Pacific Star can accept reroute with +5 day transit. Additional freight cost: $12,000. No other vessels available sooner.",
          },
          {
            id: "es-3b",
            type: "semi-autonomous",
            label: "Draft reroute request to GlobalTech",
            description: "Preparing email to GlobalTech logistics coordinator requesting shipment reroute.",
            draftContent: {
              to: "logistics@globaltech.com",
              subject: "Urgent: Reroute request for shipment SH-2048 to Port of Los Angeles",
              body: "Dear GlobalTech Logistics Team,\n\nDue to the ongoing worker strike at the Port of Houston, we are requesting an immediate reroute of shipment SH-2048 to the Port of Los Angeles.\n\nShipment details:\n- Shipment ID: SH-2048\n- Current destination: Port of Houston\n- Requested destination: Port of Los Angeles\n- Contents: 12 LED module SKUs\n- Current vessel: MV Pacific Star (Maersk)\n\nWe understand this will incur approximately $12,000 in additional freight charges and add ~5 days to transit time. Please confirm the reroute is possible and provide the revised ETA.\n\nWe will arrange inland transport from LA to our Houston warehouse on our end.\n\nThank you for your prompt attention to this matter.\n\nBest regards,\nSupply Chain Operations",
            },
          },
          {
            id: "es-3c",
            type: "manual",
            label: "Call GlobalTech to confirm",
            description: "Follow up with GlobalTech by phone to confirm the reroute.",
            manualInstruction: "Please call the GlobalTech logistics coordinator (contact: Wei Chen, +86-755-8888-1234) to:\n\n1. Verbally confirm they received the reroute request email\n2. Get their verbal commitment on the revised ETA\n3. Confirm the $12,000 additional charge is final (no hidden fees)\n4. Ask if they need any documentation from our end\n\nOnce you've spoken with them, come back and update me on the outcome.",
          },
          {
            id: "es-3d",
            type: "autonomous",
            label: "Book inland transport LA → Houston",
            description: "Arranging trucking from Port of LA to Houston warehouse.",
            autonomousPreview: "✅ Inland transport booked — XPO Logistics truck scheduled for pickup at Port of LA on arrival day. Route: LA → Houston (2-day transit). Cost: $3,200. Tracking will be provided upon pickup.",
          },
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
        executionSteps: [
          { id: "es-4a", type: "autonomous", label: "Check port loading schedule", description: "Querying Shenzhen port for available priority berths.", autonomousPreview: "✅ Priority berth available — Slot B-14 open tomorrow at 06:00 local. Expedite fee: $8,000. Must confirm within 4 hours." },
          { id: "es-4b", type: "semi-autonomous", label: "Draft expedite request", description: "Preparing the expedite request form.", draftContent: { to: "portops@shenzhenport.gov.cn", subject: "Priority Loading Request — Shipment SH-3021", body: "Dear Port Operations,\n\nWe request priority loading for shipment SH-3021 at berth B-14 tomorrow at 06:00. We confirm acceptance of the $8,000 expedite fee.\n\nVessel: COSCO Pacific\nCargo: 8 microcontroller SKUs\n\nPlease confirm the slot reservation.\n\nRegards,\nSupply Chain Ops" } },
          { id: "es-4c", type: "manual", label: "Confirm departure with COSCO", description: "Call COSCO to confirm vessel loading.", manualInstruction: "Call COSCO shipping line (contact: Port Agent, +86-755-2222-3333) to confirm they can accommodate accelerated loading at berth B-14. Confirm departure before the typhoon arrival window (48 hours)." },
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
        executionSteps: [
          { id: "es-5a", type: "autonomous", label: "Check TaiwanSemi inventory", description: "Querying TaiwanSemi for microcontroller availability.", autonomousPreview: "✅ All 8 SKUs available at TaiwanSemi. Lead time: 3 days production + 4 days air freight. Total: $22,000." },
          { id: "es-5b", type: "semi-autonomous", label: "Draft purchase order", description: "Preparing PO for TaiwanSemi.", draftContent: { to: "sales@taiwansemi.com", subject: "Emergency PO — 8 Microcontroller SKUs", body: "Dear TaiwanSemi Sales,\n\nWe need to place an emergency order for 8 microcontroller SKUs due to Shenzhen port disruption.\n\nTotal: $22,000\nShipping: Air freight to Long Beach, CA\nRequired delivery: Within 7 days\n\nPlease confirm and send PO acknowledgment.\n\nRegards,\nProcurement" } },
          { id: "es-5c", type: "autonomous", label: "Update supply chain records", description: "Updating sourcing records and insurance documentation.", autonomousPreview: "✅ Records updated — New sourcing entry for TaiwanSemi added. Insurance claim initiated for Shenzhen shipment delay (Claim #INS-2026-0847)." },
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
        executionSteps: [
          { id: "es-6a", type: "autonomous", label: "Identify domestic suppliers", description: "Searching supplier database for qualified US steel suppliers.", autonomousPreview: "✅ Found 3 qualified suppliers: USMetals Corp (low risk), SteelCo Inc (low risk), AmeriSteel LLC (medium risk). Requesting quotes from all three." },
          { id: "es-6b", type: "semi-autonomous", label: "Draft RFQ to suppliers", description: "Preparing request for quote.", draftContent: { to: "sales@usmetals.com; quotes@steelco.com", subject: "RFQ — Steel Components for 5 SKUs (Tariff Mitigation)", body: "Dear Sales Team,\n\nWe are evaluating domestic sourcing options for steel components currently imported from EU suppliers. Please provide quotes for the attached specifications.\n\nVolume: ~$340K annual\nRequired: Sample materials for qualification\nTimeline: 2-4 week transition\n\nPlease respond within 5 business days.\n\nRegards,\nProcurement" } },
          { id: "es-6c", type: "manual", label: "Run QA tests on samples", description: "Test domestic steel samples.", manualInstruction: "Once samples arrive from domestic suppliers (expect 5-7 business days), please:\n\n1. Send samples to the QA lab for material testing\n2. Compare results against current EU supplier specs\n3. Document any deviations\n\nReport back with QA results so we can finalize the supplier selection." },
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
        executionSteps: [
          { id: "es-7a", type: "autonomous", label: "Generate cost impact analysis", description: "Calculating tariff impact across product lines.", autonomousPreview: "✅ Analysis complete — 5 product lines affected. Average cost increase: 10.2%. Recommended price adjustment: 8-12% depending on product margin." },
          { id: "es-7b", type: "semi-autonomous", label: "Draft pricing proposals", description: "Preparing pricing adjustment letters.", draftContent: { to: "key-accounts@customers.com", subject: "Pricing Adjustment Notice — EU Carbon Border Tax Impact", body: "Dear Valued Customer,\n\nDue to the new EU Carbon Border Adjustment Mechanism (CBAM), we are experiencing an 8-12% increase in steel and aluminum input costs.\n\nTo maintain our quality standards, we need to implement a pricing adjustment of [X]% effective [date].\n\nWe value our partnership and are happy to discuss flexible terms.\n\nBest regards,\nAccount Management" } },
          { id: "es-7c", type: "manual", label: "Schedule customer calls", description: "Set up calls with key accounts.", manualInstruction: "Please schedule calls with your top 5 customers to discuss the pricing adjustments. Use the cost impact analysis and pricing proposals as talking points. Key accounts to contact:\n\n1. Acme Corp — John Smith\n2. TechParts Inc — Sarah Lee\n3. BuildRight — Mike Johnson\n4. GlobalAssembly — Wei Zhang\n5. QuickShip Corp — Ana Martinez\n\nConfirm once calls are scheduled." },
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
        executionSteps: [
          { id: "es-8a", type: "semi-autonomous", label: "Draft capability assessment request", description: "Preparing outreach to TaiwanCap.", draftContent: { to: "sales@taiwancap.com", subject: "Supplier Qualification Inquiry — Type-C Ceramic Capacitors", body: "Dear TaiwanCap Team,\n\nWe are evaluating secondary suppliers for Type-C ceramic capacitors. Could you provide:\n\n1. Production capacity and lead times\n2. Quality certifications\n3. Sample availability for engineering evaluation\n\nAnnual volume: ~$210K\nQualification timeline: 60 days\n\nLooking forward to your response.\n\nRegards,\nSupplier Quality Team" } },
          { id: "es-8b", type: "manual", label: "Schedule facility audit", description: "Arrange on-site audit of TaiwanCap facility.", manualInstruction: "Once TaiwanCap responds with their capability information, please:\n\n1. Schedule a facility audit visit (2-day trip to Taiwan)\n2. Coordinate with your quality engineering team for audit participation\n3. Prepare the supplier qualification checklist\n\nConfirm the audit date once scheduled." },
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
        executionSteps: [
          { id: "es-9a", type: "autonomous", label: "Verify reorder details", description: "Cross-checking automated reorder against inventory policy.", autonomousPreview: "✅ Reorder verified — SKU-456 order matches safety stock policy. Pricing within 5% of contract rate. ElectroParts confirmed shipment." },
          { id: "es-9b", type: "autonomous", label: "Log audit trail", description: "Recording action in supply chain audit system.", autonomousPreview: "✅ Audit logged — Entry #AUD-2026-1847 created. Automated reorder approved and documented." },
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
        executionSteps: [
          { id: "es-10a", type: "autonomous", label: "Review forecast model", description: "Analyzing demand forecast accuracy and assumptions.", autonomousPreview: "✅ Forecast review complete — Model accuracy: 94% over last 4 quarters. Q2 spike prediction based on 3-year historical pattern. Confidence: High." },
          { id: "es-10b", type: "autonomous", label: "Confirm WMS levels", description: "Verifying buffer stock levels in warehouse management system.", autonomousPreview: "✅ WMS confirmed — All 6 SKUs buffer levels updated. Total additional holding: $45,000. Space allocation: Verified with warehouse capacity." },
          { id: "es-10c", type: "manual", label: "Approve holding cost", description: "Finance approval needed.", manualInstruction: "Please approve the $45,000 additional holding cost allocation with your finance department. This needs budget code approval and sign-off from the CFO for amounts over $25K.\n\nConfirm once finance has approved the allocation." },
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
        executionSteps: [
          { id: "es-11a", type: "autonomous", label: "Cancel restock orders", description: "Cancelling pending orders for 6 SKUs.", autonomousPreview: "✅ 4 of 6 pending orders cancelled. 2 orders already shipped — these will be received but not trigger additional reorders." },
          { id: "es-11b", type: "autonomous", label: "Reset safety stock", description: "Reverting thresholds in WMS.", autonomousPreview: "✅ Safety stock thresholds reset to pre-adjustment levels for all 6 SKUs. Stockout risk: 18% for Q2. Operations team notified via system alert." },
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
