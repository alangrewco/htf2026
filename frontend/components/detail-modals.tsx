"use client";

import {
    Package,
    Truck,
    Users,
    MapPin,
    Circle,
    ChevronRight,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Sku, Shipment, Supplier } from "@/sdk/model";
import { ShipmentStatus } from "@/sdk/model";
import { useReferenceData } from "@/lib/api/reference/use-reference-data";

// ── Shared helpers ───────────────────────────────────────

const riskConfig = {
    critical: { color: "text-urgency-critical", bg: "bg-urgency-critical/15", border: "border-urgency-critical/30", glow: "shadow-urgency-critical/10" },
    high: { color: "text-urgency-critical", bg: "bg-urgency-critical/10", border: "border-urgency-critical/20", glow: "shadow-urgency-critical/5" },
    medium: { color: "text-urgency-warning", bg: "bg-urgency-warning/10", border: "border-urgency-warning/20", glow: "shadow-urgency-warning/5" },
    low: { color: "text-urgency-safe", bg: "bg-urgency-safe/10", border: "border-urgency-safe/20", glow: "shadow-urgency-safe/5" },
};

const statusConfig: Record<ShipmentStatus, { color: string; bg: string; label: string }> = {
    [ShipmentStatus.in_transit]: { color: "text-sky-400", bg: "bg-sky-400/10", label: "In Transit" },
    [ShipmentStatus.delayed]: { color: "text-urgency-critical", bg: "bg-urgency-critical/10", label: "Delayed" },
    [ShipmentStatus.planned]: { color: "text-muted-foreground", bg: "bg-muted/50", label: "Planned" },
    [ShipmentStatus.delivered]: { color: "text-urgency-safe", bg: "bg-urgency-safe/10", label: "Delivered" },
    [ShipmentStatus.cancelled]: { color: "text-muted-foreground", bg: "bg-muted/50", label: "Cancelled" },
};

function InfoRow({ icon: Icon, label, value, className = "" }: { icon: React.ElementType; label: string; value: string | number; className?: string }) {
    return (
        <div className={`flex items-start gap-3 ${className}`}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
                <div className="text-[11px] text-muted-foreground">{label}</div>
                <div className="text-sm font-medium">{String(value)}</div>
            </div>
        </div>
    );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">{children}</h4>;
}

// ── SKU Detail Modal ─────────────────────────────────────

export function SKUDetailModal({
    sku,
    open,
    onOpenChange,
}: {
    sku: Sku | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { supplierNamesForSku, shipmentsBySku } = useReferenceData();
    if (!sku) return null;
    const conf = riskConfig[sku.risk_level as keyof typeof riskConfig] || riskConfig.medium;
    const supplierNames = supplierNamesForSku(sku.id);
    const skuShipments = shipmentsBySku.get(sku.id) || [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[85vh] p-0 overflow-hidden border-border/50 bg-card/95 backdrop-blur-xl">
                <ScrollArea className="max-h-[85vh]">
                    <div className="p-6 space-y-6">
                        {/* Header */}
                        <DialogHeader className="space-y-3">
                            <div className="flex items-start gap-4">
                                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${conf.bg} ${conf.border} border`}>
                                    <Package className={`h-5 w-5 ${conf.color}`} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <DialogTitle className="text-lg font-semibold">{sku.name}</DialogTitle>
                                    <DialogDescription className="flex items-center gap-2 mt-1">
                                        <span className="font-mono text-xs">{sku.sku_code}</span>
                                        <span>·</span>
                                        <span>{sku.category}</span>
                                    </DialogDescription>
                                </div>
                                <Badge variant="outline" className={`${conf.bg} ${conf.color} ${conf.border} shrink-0`}>{sku.risk_level} risk</Badge>
                            </div>
                        </DialogHeader>

                        {/* Risk Score Bar */}
                        <div className={`rounded-lg p-3 ${conf.bg} border ${conf.border}`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-muted-foreground">Risk Score</span>
                                <span className={`text-sm font-bold ${conf.color}`}>{sku.risk_score}/100</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-muted/50 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${sku.risk_score >= 70 ? "bg-urgency-critical" : sku.risk_score >= 40 ? "bg-urgency-warning" : "bg-urgency-safe"}`}
                                    style={{ width: `${sku.risk_score}%` }}
                                />
                            </div>
                        </div>

                        <Separator />

                        {/* SKU Information */}
                        <div>
                            <SectionLabel>SKU Details</SectionLabel>
                            <div className="grid grid-cols-2 gap-4">
                                <InfoRow icon={Package} label="Unit of Measure" value={sku.unit_of_measure} />
                                <InfoRow icon={Circle} label="Status" value={sku.status} />
                            </div>
                        </div>

                        <Separator />

                        {/* Suppliers */}
                        {supplierNames.length > 0 && (
                            <>
                                <div>
                                    <SectionLabel>Suppliers</SectionLabel>
                                    <div className="flex flex-wrap gap-2">
                                        {supplierNames.map((s) => (
                                            <Badge key={s} variant="outline" className="bg-muted/30 text-xs">{s}</Badge>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Shipments */}
                        {skuShipments.length > 0 && (
                            <>
                                <Separator />
                                <div>
                                    <SectionLabel>Associated Shipments</SectionLabel>
                                    <div className="space-y-2">
                                        {skuShipments.map((shipment) => {
                                            const shipmentConf = statusConfig[shipment.status];
                                            return (
                                                <div key={shipment.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/10 px-4 py-2.5">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm font-mono font-medium">{shipment.shipment_code}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Badge variant="outline" className={`text-[10px] ${shipmentConf?.bg} ${shipmentConf?.color}`}>
                                                            {shipmentConf?.label || shipment.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

// ── Shipment Detail Modal ────────────────────────────────

export function ShipmentDetailModal({
    shipment,
    open,
    onOpenChange,
}: {
    shipment: Shipment | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { portName, skuName, supplierName } = useReferenceData();
    if (!shipment) return null;
    const conf = statusConfig[shipment.status] ?? statusConfig[ShipmentStatus.planned];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[85vh] p-0 overflow-hidden border-border/50 bg-card/95 backdrop-blur-xl">
                <ScrollArea className="max-h-[85vh]">
                    <div className="p-6 space-y-6">
                        {/* Header */}
                        <DialogHeader className="space-y-3">
                            <div className="flex items-start gap-4">
                                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${conf.bg} border border-border/30`}>
                                    <Truck className={`h-5 w-5 ${conf.color}`} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <DialogTitle className="text-lg font-semibold">{shipment.shipment_code}</DialogTitle>
                                    <DialogDescription className="mt-1">
                                        <Badge variant="outline" className={`${conf.bg} ${conf.color}`}>{conf.label}</Badge>
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        {/* Route Visualization */}
                        <div className="rounded-lg border border-border/50 bg-muted/10 p-4">
                            <div className="flex items-center gap-4">
                                <div className="flex-1 text-center truncate">
                                    <div className="text-[11px] text-muted-foreground mb-1">Origin</div>
                                    <div className="text-sm font-medium">{portName(shipment.origin_port_id)}</div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <div className="h-px w-8 bg-border" />
                                    <MapPin className="h-4 w-4 text-primary" />
                                    <div className="h-px w-8 bg-border" />
                                </div>
                                <div className="flex-1 text-center truncate">
                                    <div className="text-[11px] text-muted-foreground mb-1">Destination</div>
                                    <div className="text-sm font-medium">{portName(shipment.destination_port_id)}</div>
                                </div>
                            </div>
                            <div className="text-center mt-3">
                                <span className="text-xs text-muted-foreground">Expected Delivery: </span>
                                <span className="text-xs font-medium">
                                    {new Date(shipment.expected_delivery_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                </span>
                            </div>
                        </div>

                        <Separator />

                        {/* Shipping Details */}
                        <div>
                            <SectionLabel>Shipping Details</SectionLabel>
                            <div className="grid grid-cols-2 gap-4">
                                <InfoRow icon={Truck} label="Carrier" value={shipment.carrier || "—"} />
                                <InfoRow icon={Users} label="Supplier" value={supplierName(shipment.supplier_id)} />
                            </div>
                        </div>

                        {/* SKUs */}
                        <div>
                            <SectionLabel>SKUs in Shipment</SectionLabel>
                            <div className="flex flex-wrap gap-1.5">
                                {shipment.sku_ids.map((skuId) => (
                                    <Badge key={skuId} variant="outline" className="bg-muted/30 text-[10px] font-mono">
                                        {skuName(skuId)}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* Tracking Timeline */}
                        {shipment.events && shipment.events.length > 0 && (
                            <>
                                <Separator />
                                <div>
                                    <SectionLabel>Tracking Timeline</SectionLabel>
                                    <div className="space-y-0">
                                        {[...shipment.events]
                                            .sort((a, b) => new Date(b.event_time).getTime() - new Date(a.event_time).getTime())
                                            .map((event, i, arr) => {
                                                const isFirst = i === 0;
                                                const isLast = i === arr.length - 1;
                                                return (
                                                    <div key={`${event.id}`} className="flex gap-4">
                                                        {/* Timeline connector */}
                                                        <div className="flex flex-col items-center">
                                                            {isFirst ? (
                                                                <div className="h-3 w-3 rounded-full bg-primary ring-2 ring-primary/30 mt-1" />
                                                            ) : (
                                                                <Circle className="h-3 w-3 text-muted-foreground mt-1 fill-muted-foreground/20" />
                                                            )}
                                                            {!isLast && <div className="w-px flex-1 bg-border/50 my-1" />}
                                                        </div>
                                                        {/* Content */}
                                                        <div className={`pb-4 ${isFirst ? "" : "opacity-70"}`}>
                                                            <div className="text-[11px] text-muted-foreground">
                                                                {new Date(event.event_time).toLocaleString()} · {event.location}
                                                            </div>
                                                            <div className="text-sm">{event.description}</div>
                                                            {event.status !== "ok" && (
                                                                <Badge variant="outline" className="mt-1 text-[10px] bg-urgency-warning/10 text-urgency-warning border-urgency-warning/20">
                                                                    {event.status}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

// ── Supplier Detail Modal ────────────────────────────────

export function SupplierDetailModal({
    supplier,
    open,
    onOpenChange,
}: {
    supplier: Supplier | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { skuNamesForSupplier, shipmentsBySupplier } = useReferenceData();
    if (!supplier) return null;
    const conf = riskConfig[supplier.risk_rating as keyof typeof riskConfig] || riskConfig.medium;
    const supplierSkus = skuNamesForSupplier(supplier.id);
    const supplierShipments = shipmentsBySupplier.get(supplier.id) || [];
    
    const activeShipments = supplierShipments.filter(s => s.status === ShipmentStatus.in_transit).length;
    const plannedShipments = supplierShipments.filter(s => s.status === ShipmentStatus.planned).length;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[85vh] p-0 overflow-hidden border-border/50 bg-card/95 backdrop-blur-xl">
                <ScrollArea className="max-h-[85vh]">
                    <div className="p-6 space-y-6">
                        {/* Header */}
                        <DialogHeader className="space-y-3">
                            <div className="flex items-start gap-4">
                                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${conf.bg} ${conf.border} border`}>
                                    <Users className={`h-5 w-5 ${conf.color}`} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <DialogTitle className="text-lg font-semibold">{supplier.name}</DialogTitle>
                                    <DialogDescription className="flex items-center gap-2 mt-1">
                                        <MapPin className="h-3 w-3" />
                                        <span>{supplier.country}</span>
                                        <span>·</span>
                                        <span>{supplier.region}</span>
                                    </DialogDescription>
                                </div>
                                <Badge variant="outline" className={`${conf.bg} ${conf.color} ${conf.border} shrink-0`}>{supplier.risk_rating} risk</Badge>
                            </div>
                        </DialogHeader>

                        {/* Performance Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-border/50 bg-muted/10 p-4">
                                <div className="flex gap-8">
                                    <div className="text-center">
                                        <div className="text-xl font-bold text-foreground">{activeShipments}</div>
                                        <div className="text-[12px] text-muted-foreground">In Transit</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xl font-bold text-foreground">{plannedShipments}</div>
                                        <div className="text-[12px] text-muted-foreground">Planned</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xl font-bold text-foreground">{supplierShipments.length}</div>
                                        <div className="text-[12px] text-muted-foreground">Total</div>
                                    </div>
                                </div>
                                <span className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">Shipments</span>
                            </div>
                            <div className="flex flex-col justify-center gap-1.5 rounded-lg border border-border/50 bg-muted/10 p-4 overflow-hidden">
                                <div className="text-[12px] text-muted-foreground mb-1 text-center">Contact Information</div>
                                <div className="text-sm font-medium text-center truncate">{supplier.contact_email}</div>
                            </div>
                        </div>

                        <Separator />

                        {/* SKUs Supplied */}
                        {supplierSkus.length > 0 && (
                            <>
                                <div>
                                    <SectionLabel>SKUs Supplied</SectionLabel>
                                    <div className="flex flex-wrap gap-2">
                                        {supplierSkus.map((s) => (
                                            <Badge key={s} variant="outline" className="bg-muted/30 text-xs">{s}</Badge>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Recent Shipments */}
                        {supplierShipments.length > 0 && (
                            <>
                                <Separator />
                                <div>
                                    <SectionLabel>Recent Shipments</SectionLabel>
                                    <div className="space-y-2">
                                        {[...supplierShipments]
                                            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                            .slice(0, 5)
                                            .map((shipment) => {
                                                const shipmentConf = statusConfig[shipment.status];
                                                return (
                                                    <div key={shipment.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/10 px-4 py-2.5">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-sm font-mono font-medium">{shipment.shipment_code}</span>
                                                            <span className="text-[11px] text-muted-foreground">
                                                                {new Date(shipment.created_at).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <Badge variant="outline" className={`text-[10px] ${shipmentConf?.bg} ${shipmentConf?.color}`}>
                                                                {shipmentConf?.label || shipment.status}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
