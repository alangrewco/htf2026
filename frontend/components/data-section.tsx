"use client";

import { useMemo, useState, Suspense, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { SKUDetailModal, ShipmentDetailModal, SupplierDetailModal } from "@/components/detail-modals";
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
  type SKU,
  type Shipment,
  type Supplier,
  useReferenceData,
} from "@/lib/api/reference/use-reference-data";

// ── Risk level config ────────────────────────────────────

const riskConfig = {
  critical: { color: "text-urgency-critical", bg: "bg-urgency-critical/15", border: "border-urgency-critical/30" },
  high: { color: "text-urgency-critical", bg: "bg-urgency-critical/10", border: "border-urgency-critical/20" },
  medium: { color: "text-urgency-warning", bg: "bg-urgency-warning/10", border: "border-urgency-warning/20" },
  low: { color: "text-urgency-safe", bg: "bg-urgency-safe/10", border: "border-urgency-safe/20" },
};

const statusConfig = {
  "in-transit": { color: "text-sky-400", bg: "bg-sky-400/10", label: "In Transit" },
  delayed: { color: "text-urgency-critical", bg: "bg-urgency-critical/10", label: "Delayed" },
  planned: { color: "text-muted-foreground", bg: "bg-muted/50", label: "Planned" },
  delivered: { color: "text-urgency-safe", bg: "bg-urgency-safe/10", label: "Delivered" },
};

// ── Risk Score Bar ───────────────────────────────────────

function RiskScoreBar({ score, level }: { score: number; level: SKU["riskLevel"] }) {
  const conf = riskConfig[level];
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-muted/50 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${score >= 70 ? "bg-urgency-critical" : score >= 40 ? "bg-urgency-warning" : "bg-urgency-safe"}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-xs font-medium ${conf.color}`}>{score}</span>
    </div>
  );
}

// ── SKU Row ──────────────────────────────────────────────

function SKURow({ sku, index, onClick }: { sku: SKU; index: number; onClick?: () => void }) {
  const conf = riskConfig[sku.riskLevel];
  return (
    <div
      onClick={onClick}
      className="group flex items-center gap-4 rounded-lg border border-border/50 bg-card/50 p-3 transition-all hover:bg-accent/30 hover:border-border cursor-pointer"
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${conf.bg}`}>
        <Package className={`h-4 w-4 ${conf.color}`} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{sku.name}</span>
          <Badge variant="outline" className={`${conf.bg} ${conf.color} ${conf.border} text-[10px]`}>
            {sku.riskLevel}
          </Badge>
        </div>
        <div className="mt-0.5 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span>{sku.id}</span>
          <span>·</span>
          <span>{sku.category}</span>
          <span>·</span>
          <span>${(sku.revenue / 1_000).toFixed(0)}K rev.</span>
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-4">
        <RiskScoreBar score={sku.riskScore} level={sku.riskLevel} />

        <div className="text-[11px] text-muted-foreground max-w-[180px] truncate">
          {sku.topSuppliers.slice(0, 3).join(", ")}
        </div>
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </div>
  );
}

// ── Shipment Row ─────────────────────────────────────────

function ShipmentRow({ shipment, index, onClick }: { shipment: Shipment; index: number; onClick?: () => void }) {
  const conf = statusConfig[shipment.status];
  return (
    <div
      onClick={onClick}
      className="group flex items-center gap-4 rounded-lg border border-border/50 bg-card/50 p-3 transition-all hover:bg-accent/30 hover:border-border cursor-pointer"
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${conf.bg}`}>
        <Truck className={`h-4 w-4 ${conf.color}`} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{shipment.id}</span>
          <Badge variant="outline" className={`${conf.bg} ${conf.color} text-[10px]`}>
            {conf.label}
          </Badge>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span className="truncate">
            {shipment.origin} → {shipment.destination}
          </span>
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-4">
        <div className="text-[11px] text-right">
          <div className="text-muted-foreground">{shipment.carrier}</div>
          <div className="text-foreground/80">{shipment.eta}</div>
        </div>
        <div className="text-[11px] text-muted-foreground max-w-[140px] truncate">
          {shipment.skus.slice(0, 3).join(", ")}
        </div>
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </div>
  );
}

// ── Supplier Row ─────────────────────────────────────────

function SupplierRow({ supplier, index, onClick }: { supplier: Supplier; index: number; onClick?: () => void }) {
  const conf = riskConfig[supplier.riskRating];
  return (
    <div
      onClick={onClick}
      className="group flex items-center gap-4 rounded-lg border border-border/50 bg-card/50 p-3 transition-all hover:bg-accent/30 hover:border-border cursor-pointer"
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${conf.bg}`}>
        <Users className={`h-4 w-4 ${conf.color}`} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{supplier.name}</span>
          <Badge variant="outline" className={`${conf.bg} ${conf.color} ${conf.border} text-[10px]`}>
            {supplier.riskRating} risk
          </Badge>
        </div>
        <div className="mt-0.5 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span>{supplier.region}</span>
          <span>·</span>
          <span>{supplier.activeShipments} active</span>
          <span>·</span>
          <span>{supplier.plannedShipments} planned</span>
          <span>·</span>
          <span>{supplier.recurringShipments} recurring</span>
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-4">
        <div className="text-[11px] text-muted-foreground max-w-[180px] truncate">
          {supplier.skus.slice(0, 3).join(", ")}
        </div>
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </div>
  );
}

// ── Main Data Section ────────────────────────────────────

function DataSectionContent() {
  const { skus, shipments, suppliers } = useReferenceData();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const activeTab = searchParams.get("tab") || "skus";
  // Search is driven by the `q` URL param, set by CommandBar
  const search = searchParams.get("q") || "";

  // Detail modal state
  const [selectedSku, setSelectedSku] = useState<SKU | null>(null);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // Listen for navbar tab-switch events (for same-page navigation)
  useEffect(() => {
    function handleTabSwitch(e: Event) {
      const customEvent = e as CustomEvent<string>;
      const tab = customEvent.detail;
      // Keep URL in sync (safety net for callers that don't update the URL themselves)
      const params = new URLSearchParams(searchParams.toString());
      if (params.get("tab") !== tab) {
        params.set("tab", tab);
        router.replace(`${pathname}?${params.toString()}#data-explorer-section`, { scroll: false });
      }
    }
    window.addEventListener("switch-tab", handleTabSwitch);
    return () => window.removeEventListener("switch-tab", handleTabSwitch);
  }, [searchParams, router]);

  const handleTabChange = (value: string) => {
    // Update URL — React will re-render with the new searchParams automatically
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`${pathname}?${params.toString()}#data-explorer-section`, { scroll: false });
  };

  const filteredSKUs = useMemo(() => {
    if (!search) return skus;
    const q = search.toLowerCase();
    return skus.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
    );
  }, [skus, search]);

  const filteredShipments = useMemo(() => {
    if (!search) return shipments;
    const q = search.toLowerCase();
    return shipments.filter(
      (s) =>
        s.id.toLowerCase().includes(q) ||
        s.origin.toLowerCase().includes(q) ||
        s.destination.toLowerCase().includes(q) ||
        s.carrier.toLowerCase().includes(q)
    );
  }, [shipments, search]);

  const filteredSuppliers = useMemo(() => {
    if (!search) return suppliers;
    const q = search.toLowerCase();
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.region.toLowerCase().includes(q)
    );
  }, [suppliers, search]);

  return (
    <div id="data-section" className="flex flex-col px-5 pt-2 pb-8">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col">
        <TabsContent value="skus" className="flex-1 mt-0">
          <div className="space-y-2">
            {filteredSKUs.map((sku, i) => (
              <SKURow key={sku.id} sku={sku} index={i} onClick={() => setSelectedSku(sku)} />
            ))}
            {filteredSKUs.length === 0 && (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No SKUs match your search.
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="shipments" className="flex-1 mt-0">
          <div className="space-y-2">
            {filteredShipments.map((shipment, i) => (
              <ShipmentRow key={shipment.id} shipment={shipment} index={i} onClick={() => setSelectedShipment(shipment)} />
            ))}
            {filteredShipments.length === 0 && (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No shipments match your search.
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="suppliers" className="flex-1 mt-0">
          <div className="space-y-2">
            {filteredSuppliers.map((supplier, i) => (
              <SupplierRow key={supplier.id} supplier={supplier} index={i} onClick={() => setSelectedSupplier(supplier)} />
            ))}
            {filteredSuppliers.length === 0 && (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No suppliers match your search.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Detail Modals */}
      <SKUDetailModal sku={selectedSku} open={!!selectedSku} onOpenChange={(open) => { if (!open) setSelectedSku(null); }} />
      <ShipmentDetailModal shipment={selectedShipment} open={!!selectedShipment} onOpenChange={(open) => { if (!open) setSelectedShipment(null); }} />
      <SupplierDetailModal supplier={selectedSupplier} open={!!selectedSupplier} onOpenChange={(open) => { if (!open) setSelectedSupplier(null); }} />
    </div>
  );
}

export function DataSection() {
  return (
    <Suspense fallback={<div className="h-96 flex items-center justify-center text-muted-foreground">Loading data...</div>}>
      <DataSectionContent />
    </Suspense>
  );
}
