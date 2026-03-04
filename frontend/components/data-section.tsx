"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  ArrowUpDown,
  Package,
  Truck,
  Users,
  AlertTriangle,
  ChevronRight,
  MapPin,
  BarChart3,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  skus,
  shipments,
  suppliers,
  type SKU,
  type Shipment,
  type Supplier,
} from "@/lib/mock-data";

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

function SKURow({ sku, index }: { sku: SKU; index: number }) {
  const conf = riskConfig[sku.riskLevel];
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
    </motion.div>
  );
}

// ── Shipment Row ─────────────────────────────────────────

function ShipmentRow({ shipment, index }: { shipment: Shipment; index: number }) {
  const conf = statusConfig[shipment.status];
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
    </motion.div>
  );
}

// ── Supplier Row ─────────────────────────────────────────

function SupplierRow({ supplier, index }: { supplier: Supplier; index: number }) {
  const conf = riskConfig[supplier.riskRating];
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
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
    </motion.div>
  );
}

// ── Main Data Section ────────────────────────────────────

function DataSectionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "skus");
  const [search, setSearch] = useState("");

  // Sync state with URL search params
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && (tab === "skus" || tab === "shipments" || tab === "suppliers")) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Listen for navbar tab-switch events (for same-page navigation)
  useEffect(() => {
    function handleTabSwitch(e: Event) {
      const customEvent = e as CustomEvent<string>;
      setActiveTab(customEvent.detail);
    }
    window.addEventListener("switch-tab", handleTabSwitch);
    return () => window.removeEventListener("switch-tab", handleTabSwitch);
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Update URL without full refresh to keep state in sync
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`/?${params.toString()}#data-section`, { scroll: false });
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
    <div id="data-section" className="snap-section flex flex-col px-5 pt-6 pb-8">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col">
        {/* Tab bar + search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <TabsList className="bg-muted/50 border border-border/50">
            <TabsTrigger value="skus" className="gap-1.5 text-xs cursor-pointer">
              <Package className="h-3.5 w-3.5" />
              SKUs
              <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1.5">
                {skus.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="shipments" className="gap-1.5 text-xs cursor-pointer">
              <Truck className="h-3.5 w-3.5" />
              Shipments
              <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1.5">
                {shipments.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="gap-1.5 text-xs cursor-pointer">
              <Users className="h-3.5 w-3.5" />
              Suppliers
              <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1.5">
                {suppliers.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Fuzzy search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-56 pl-8 text-xs bg-input/30 border-border/50"
              />
            </div>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <Filter className="h-3.5 w-3.5" />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <ArrowUpDown className="h-3.5 w-3.5" />
              Sort
            </Button>
          </div>
        </div>

        {/* Tab content */}
        <TabsContent value="skus" className="flex-1 mt-0">
          <AnimatePresence mode="wait">
            <div className="space-y-2">
              {filteredSKUs.map((sku, i) => (
                <SKURow key={sku.id} sku={sku} index={i} />
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
                <ShipmentRow key={shipment.id} shipment={shipment} index={i} />
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
                <SupplierRow key={supplier.id} supplier={supplier} index={i} />
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
  );
}

export function DataSection() {
  return (
    <Suspense fallback={<div className="h-96 flex items-center justify-center text-muted-foreground">Loading data...</div>}>
      <DataSectionContent />
    </Suspense>
  );
}
