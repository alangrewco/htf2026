"use client";

import { useMemo, Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Package,
  Truck,
  Users,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  skus,
  shipments,
  suppliers,
  type SKU,
  type Shipment,
  type Supplier,
} from "@/lib/mock-data";

/* ── Risk level config ────────────────────────────────────── */

const riskColors: Record<string, string> = {
  critical: "#c4444a",
  high: "#c4444a",
  medium: "#d4a84a",
  low: "#5aab7a",
};

const statusConfig: Record<string, { color: string; label: string }> = {
  "in-transit": { color: "#7296c4", label: "In Transit" },
  delayed: { color: "#c4444a", label: "Delayed" },
  planned: { color: "#6b6b78", label: "Planned" },
  delivered: { color: "#5aab7a", label: "Delivered" },
};

/* ── Risk Score Bar ───────────────────────────────────────── */

function RiskScoreBar({ score, level }: { score: number; level: SKU["riskLevel"] }) {
  const color = riskColors[level] || "#6b6b78";
  return (
    <div className="flex items-center gap-2">
      <div className="h-px w-16 overflow-hidden" style={{ background: "rgba(228,224,216,0.08)" }}>
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <span className="text-xs font-mono" style={{ color }}>{score}</span>
    </div>
  );
}

/* ── SKU Row ──────────────────────────────────────────────── */

function SKURow({ sku }: { sku: SKU }) {
  const color = riskColors[sku.riskLevel] || "#6b6b78";
  return (
    <div
      className="group flex items-center gap-4 py-3 px-4 transition-colors cursor-pointer"
      style={{ borderBottom: "1px solid rgba(228,224,216,0.04)" }}
    >
      <Package className="h-4 w-4 shrink-0" style={{ color }} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium truncate" style={{ color: "#e4e0d8" }}>{sku.name}</span>
          <span className="text-[10px] font-medium" style={{ color }}>{sku.riskLevel}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-3 text-[11px]" style={{ color: "#3a3a44" }}>
          <span>{sku.id}</span>
          <span>·</span>
          <span>{sku.category}</span>
          <span>·</span>
          <span>${(sku.revenue / 1_000).toFixed(0)}K rev.</span>
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-4">
        <RiskScoreBar score={sku.riskScore} level={sku.riskLevel} />
        <div className="text-[11px] max-w-[180px] truncate" style={{ color: "#3a3a44" }}>
          {sku.topSuppliers.slice(0, 3).join(", ")}
        </div>
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: "#3a3a44" }} />
    </div>
  );
}

/* ── Shipment Row ─────────────────────────────────────────── */

function ShipmentRow({ shipment }: { shipment: Shipment }) {
  const conf = statusConfig[shipment.status] || { color: "#6b6b78", label: shipment.status };
  return (
    <div
      className="group flex items-center gap-4 py-3 px-4 transition-colors cursor-pointer"
      style={{ borderBottom: "1px solid rgba(228,224,216,0.04)" }}
    >
      <Truck className="h-4 w-4 shrink-0" style={{ color: conf.color }} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium" style={{ color: "#e4e0d8" }}>{shipment.id}</span>
          <span className="text-[10px] font-medium" style={{ color: conf.color }}>{conf.label}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[11px]" style={{ color: "#3a3a44" }}>
          <MapPin className="h-3 w-3" />
          <span className="truncate">
            {shipment.origin} → {shipment.destination}
          </span>
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-4">
        <div className="text-[11px] text-right">
          <div style={{ color: "#3a3a44" }}>{shipment.carrier}</div>
          <div style={{ color: "#6b6b78" }}>{shipment.eta}</div>
        </div>
        <div className="text-[11px] max-w-[140px] truncate" style={{ color: "#3a3a44" }}>
          {shipment.skus.slice(0, 3).join(", ")}
        </div>
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: "#3a3a44" }} />
    </div>
  );
}

/* ── Supplier Row ─────────────────────────────────────────── */

function SupplierRow({ supplier }: { supplier: Supplier }) {
  const color = riskColors[supplier.riskRating] || "#6b6b78";
  return (
    <div
      className="group flex items-center gap-4 py-3 px-4 transition-colors cursor-pointer"
      style={{ borderBottom: "1px solid rgba(228,224,216,0.04)" }}
    >
      <Users className="h-4 w-4 shrink-0" style={{ color }} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium truncate" style={{ color: "#e4e0d8" }}>{supplier.name}</span>
          <span className="text-[10px] font-medium" style={{ color }}>{supplier.riskRating} risk</span>
        </div>
        <div className="mt-0.5 flex items-center gap-3 text-[11px]" style={{ color: "#3a3a44" }}>
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
        <div className="text-[11px] max-w-[180px] truncate" style={{ color: "#3a3a44" }}>
          {supplier.skus.slice(0, 3).join(", ")}
        </div>
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: "#3a3a44" }} />
    </div>
  );
}

/* ── Main Data Section ────────────────────────────────────── */

function DataSectionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get("tab") || "skus";
  const search = searchParams.get("q") || "";

  useEffect(() => {
    function handleTabSwitch(e: Event) {
      const customEvent = e as CustomEvent<string>;
      const tab = customEvent.detail;
      const params = new URLSearchParams(searchParams.toString());
      if (params.get("tab") !== tab) {
        params.set("tab", tab);
        router.replace(`/dashboard?${params.toString()}#data-explorer-section`, { scroll: false });
      }
    }
    window.addEventListener("switch-tab", handleTabSwitch);
    return () => window.removeEventListener("switch-tab", handleTabSwitch);
  }, [searchParams, router]);

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`/dashboard?${params.toString()}#data-explorer-section`, { scroll: false });
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
  }, [search]);

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
  }, [search]);

  const filteredSuppliers = useMemo(() => {
    if (!search) return suppliers;
    const q = search.toLowerCase();
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.region.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div id="data-section" className="flex flex-col px-0 pt-2 pb-8">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col">
        <TabsContent value="skus" className="flex-1 mt-0">
          <div>
            {filteredSKUs.map((sku) => (
              <SKURow key={sku.id} sku={sku} />
            ))}
            {filteredSKUs.length === 0 && (
              <p className="py-12 text-center text-sm" style={{ color: "#6b6b78" }}>
                No SKUs match your search.
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="shipments" className="flex-1 mt-0">
          <div>
            {filteredShipments.map((shipment) => (
              <ShipmentRow key={shipment.id} shipment={shipment} />
            ))}
            {filteredShipments.length === 0 && (
              <p className="py-12 text-center text-sm" style={{ color: "#6b6b78" }}>
                No shipments match your search.
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="suppliers" className="flex-1 mt-0">
          <div>
            {filteredSuppliers.map((supplier) => (
              <SupplierRow key={supplier.id} supplier={supplier} />
            ))}
            {filteredSuppliers.length === 0 && (
              <p className="py-12 text-center text-sm" style={{ color: "#6b6b78" }}>
                No suppliers match your search.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function DataSection() {
  return (
    <Suspense fallback={<div className="h-96 flex items-center justify-center" style={{ color: "#6b6b78" }}>Loading data...</div>}>
      <DataSectionContent />
    </Suspense>
  );
}
