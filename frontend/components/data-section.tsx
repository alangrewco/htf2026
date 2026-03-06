"use client";

import { useMemo, Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Truck,
  Users,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useReferenceData } from "@/lib/api/reference/use-reference-data";
import type { Sku, Shipment, Supplier } from "@/sdk/model";
import { ShipmentStatus } from "@/sdk/model";
import {
  DEMO_SKU_ENRICHMENT,
  DEMO_SHIPMENT_ENRICHMENT,
} from "@/lib/fixtures/reference/demo-enrichments";

// ── Risk level config ────────────────────────────────────

type RiskLevel = "critical" | "high" | "medium" | "low";

const riskConfig: Record<RiskLevel, { color: string; bg: string; border: string }> = {
  critical: { color: "text-urgency-critical", bg: "bg-urgency-critical/15", border: "border-urgency-critical/30" },
  high: { color: "text-urgency-critical", bg: "bg-urgency-critical/10", border: "border-urgency-critical/20" },
  medium: { color: "text-urgency-warning", bg: "bg-urgency-warning/10", border: "border-urgency-warning/20" },
  low: { color: "text-urgency-safe", bg: "bg-urgency-safe/10", border: "border-urgency-safe/20" },
};

const statusConfig: Record<ShipmentStatus, { color: string; bg: string; label: string }> = {
  [ShipmentStatus.in_transit]: { color: "text-sky-400", bg: "bg-sky-400/10", label: "In Transit" },
  [ShipmentStatus.delayed]: { color: "text-urgency-critical", bg: "bg-urgency-critical/10", label: "Delayed" },
  [ShipmentStatus.planned]: { color: "text-muted-foreground", bg: "bg-muted/50", label: "Planned" },
  [ShipmentStatus.delivered]: { color: "text-urgency-safe", bg: "bg-urgency-safe/10", label: "Delivered" },
  [ShipmentStatus.cancelled]: { color: "text-muted-foreground", bg: "bg-muted/50", label: "Cancelled" },
};

// ── Helpers ──────────────────────────────────────────────

/** Show top N names inline, with a tooltip for the full list when there are more */
function NameListWithTooltip({ names, max = 3 }: { names: string[]; max?: number }) {
  if (names.length === 0) return <span className="text-muted-foreground/50">—</span>;

  const display = names.slice(0, max).join(", ");
  const hasMore = names.length > max;

  if (!hasMore) {
    return <span>{display}</span>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-default underline decoration-dotted underline-offset-2">
          {display} +{names.length - max}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="space-y-0.5">
          {names.map((n) => (
            <div key={n} className="text-xs">{n}</div>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

// ── Risk Score Bar ───────────────────────────────────────

function RiskScoreBar({ score, level }: { score: number; level: RiskLevel }) {
  const conf = riskConfig[level];
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-muted/50 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6 }}
          className={`h-full rounded-full ${score >= 70 ? "bg-urgency-critical" : score >= 40 ? "bg-urgency-warning" : "bg-urgency-safe"}`}
        />
      </div>
      <span className={`text-xs font-medium ${conf.color}`}>{score}</span>
    </div>
  );
}

// ── SKU Row ──────────────────────────────────────────────

function SKURow({ sku, index, supplierNames, shipmentCodes }: {
  sku: Sku;
  index: number;
  supplierNames: string[];
  shipmentCodes: string[];
}) {
  const { riskScore, riskLevel, revenue, category } = DEMO_SKU_ENRICHMENT;
  // Derive category from description if possible
  const displayCategory = sku.description.split("-")[0]?.trim() || category;
  const conf = riskConfig[riskLevel];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className="group flex items-center gap-4 rounded-lg border border-border/50 bg-card/50 p-3 transition-all hover:bg-accent/30 hover:border-border cursor-pointer"
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${conf.bg}`}>
        <Package className={`h-4 w-4 ${conf.color}`} />
      </div>

      {/* Left: Name + meta */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{sku.name}</span>
          <Badge variant="outline" className={`${conf.bg} ${conf.color} ${conf.border} text-[10px]`}>
            {riskLevel}
          </Badge>
        </div>
        <div className="mt-0.5 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span>{sku.sku_code}</span>
          <span>·</span>
          <span>{displayCategory}</span>
          <span>·</span>
          {/* TODO: revenue should come from backend */}
          <span>${(revenue / 1_000).toFixed(0)}K rev.</span>
        </div>
      </div>

      {/* Middle: Supplier name list (left of risk indicator) */}
      <div className="hidden sm:flex items-center gap-4">
        <div className="text-[11px] text-muted-foreground w-[180px] truncate">
          <NameListWithTooltip names={supplierNames} />
        </div>

        {/* Right: Risk score bar */}
        <RiskScoreBar score={riskScore} level={riskLevel} />
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </motion.div>
  );
}

// ── Shipment Row ─────────────────────────────────────────

function ShipmentRow({ shipment, index, skuNames, supplierName, originName, destName }: {
  shipment: Shipment;
  index: number;
  skuNames: string[];
  supplierName: string;
  originName: string;
  destName: string;
}) {
  const conf = statusConfig[shipment.status] ?? statusConfig[ShipmentStatus.planned];
  const etaDate = new Date(shipment.eta);
  const etaLabel = etaDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className="group flex items-center gap-4 rounded-lg border border-border/50 bg-card/50 p-3 transition-all hover:bg-accent/30 hover:border-border cursor-pointer"
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${conf.bg}`}>
        <Truck className={`h-4 w-4 ${conf.color}`} />
      </div>

      {/* Left: Code + route */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{shipment.shipment_code}</span>
          <Badge variant="outline" className={`${conf.bg} ${conf.color} text-[10px]`}>
            {conf.label}
          </Badge>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span className="truncate">
            {originName} → {destName}
          </span>
          <span>·</span>
          <span>{supplierName}</span>
        </div>
      </div>

      {/* Middle: SKU name list (left of ETA) */}
      <div className="hidden sm:flex items-center gap-4">
        <div className="text-[11px] text-muted-foreground w-[180px] truncate">
          <NameListWithTooltip names={skuNames} />
        </div>

        {/* Right: Carrier + ETA */}
        <div className="text-[11px] text-right w-[100px]">
          {/* TODO: carrier should come from backend */}
          <div className="text-muted-foreground">{DEMO_SHIPMENT_ENRICHMENT.carrier}</div>
          <div className="text-foreground/80">{etaLabel}</div>
        </div>
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </motion.div>
  );
}

// ── Supplier Row ─────────────────────────────────────────

function SupplierRow({ supplier, index, skuNames, shipmentCount }: {
  supplier: Supplier;
  index: number;
  skuNames: string[];
  shipmentCount: number;
}) {
  // Use status from API (MasterStatus), not a fake risk rating
  const statusConf = supplier.status === "active"
    ? riskConfig.low
    : riskConfig.medium;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className="group flex items-center gap-4 rounded-lg border border-border/50 bg-card/50 p-3 transition-all hover:bg-accent/30 hover:border-border cursor-pointer"
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${statusConf.bg}`}>
        <Users className={`h-4 w-4 ${statusConf.color}`} />
      </div>

      {/* Left: Name + meta */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{supplier.name}</span>
          <Badge variant="outline" className={`${statusConf.bg} ${statusConf.color} ${statusConf.border} text-[10px]`}>
            {supplier.status}
          </Badge>
        </div>
        <div className="mt-0.5 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span>{supplier.supplier_code}</span>
          <span>·</span>
          <span>{supplier.country}</span>
          <span>·</span>
          <span>{shipmentCount} shipment{shipmentCount !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Middle: SKU name list (left of chevron) */}
      <div className="hidden sm:flex items-center gap-4">
        <div className="text-[11px] text-muted-foreground w-[180px] truncate">
          <NameListWithTooltip names={skuNames} />
        </div>
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </motion.div>
  );
}

// ── Main Data Section ────────────────────────────────────

function DataSectionContent() {
  const {
    skus,
    shipments,
    suppliers,
    supplierNamesForSku,
    shipmentCodesForSku,
    skuNamesForSupplier,
    shipmentsBySupplier,
    portName,
    supplierName: resolveSupplierName,
    skuName: resolveSkuName,
  } = useReferenceData();
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get("tab") || "skus";
  const search = searchParams.get("q") || "";

  // Listen for navbar tab-switch events (for same-page navigation)
  useEffect(() => {
    function handleTabSwitch(e: Event) {
      const customEvent = e as CustomEvent<string>;
      const tab = customEvent.detail;
      const params = new URLSearchParams(searchParams.toString());
      if (params.get("tab") !== tab) {
        params.set("tab", tab);
        router.replace(`/?${params.toString()}#data-explorer-section`, { scroll: false });
      }
    }
    window.addEventListener("switch-tab", handleTabSwitch);
    return () => window.removeEventListener("switch-tab", handleTabSwitch);
  }, [searchParams, router]);

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`/?${params.toString()}#data-explorer-section`, { scroll: false });
  };

  const filteredSKUs = useMemo(() => {
    if (!search) return skus;
    const q = search.toLowerCase();
    return skus.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.sku_code.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
    );
  }, [skus, search]);

  const filteredShipments = useMemo(() => {
    if (!search) return shipments;
    const q = search.toLowerCase();
    return shipments.filter(
      (s) =>
        s.shipment_code.toLowerCase().includes(q) ||
        s.origin_port_id.toLowerCase().includes(q) ||
        s.destination_port_id.toLowerCase().includes(q) ||
        portName(s.origin_port_id).toLowerCase().includes(q) ||
        portName(s.destination_port_id).toLowerCase().includes(q)
    );
  }, [shipments, search, portName]);

  const filteredSuppliers = useMemo(() => {
    if (!search) return suppliers;
    const q = search.toLowerCase();
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.supplier_code.toLowerCase().includes(q) ||
        s.country.toLowerCase().includes(q)
    );
  }, [suppliers, search]);

  return (
    <TooltipProvider>
      <div id="data-section" className="flex flex-col px-5 pt-2 pb-8">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col">
          <TabsContent value="skus" className="flex-1 mt-0">
            <AnimatePresence mode="wait">
              <div className="space-y-2">
                {filteredSKUs.map((sku, i) => (
                  <SKURow
                    key={sku.id}
                    sku={sku}
                    index={i}
                    supplierNames={supplierNamesForSku(sku.id)}
                    shipmentCodes={shipmentCodesForSku(sku.id)}
                  />
                ))}
                {filteredSKUs.length === 0 && (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    No SKUs match your search.
                  </p>
                )}
              </div>
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="shipments" className="flex-1 mt-0">
            <AnimatePresence mode="wait">
              <div className="space-y-2">
                {filteredShipments.map((shipment, i) => (
                  <ShipmentRow
                    key={shipment.id}
                    shipment={shipment}
                    index={i}
                    skuNames={shipment.sku_ids
                      .map((id) => resolveSkuName(id))
                      .sort((a, b) => a.localeCompare(b))}
                    supplierName={resolveSupplierName(shipment.supplier_id)}
                    originName={portName(shipment.origin_port_id)}
                    destName={portName(shipment.destination_port_id)}
                  />
                ))}
                {filteredShipments.length === 0 && (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    No shipments match your search.
                  </p>
                )}
              </div>
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="suppliers" className="flex-1 mt-0">
            <AnimatePresence mode="wait">
              <div className="space-y-2">
                {filteredSuppliers.map((supplier, i) => (
                  <SupplierRow
                    key={supplier.id}
                    supplier={supplier}
                    index={i}
                    skuNames={skuNamesForSupplier(supplier.id)}
                    shipmentCount={shipmentsBySupplier.get(supplier.id)?.length ?? 0}
                  />
                ))}
                {filteredSuppliers.length === 0 && (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    No suppliers match your search.
                  </p>
                )}
              </div>
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}

export function DataSection() {
  return (
    <Suspense fallback={<div className="h-96 flex items-center justify-center text-muted-foreground">Loading data...</div>}>
      <DataSectionContent />
    </Suspense>
  );
}
