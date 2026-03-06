"use client";

import {
    Package,
    Truck,
    Users,
    CalendarDays,
    DollarSign,
    Clock,
    MapPin,
    Shield,
    Phone,
    Mail,
    FileText,
    CheckCircle2,
    AlertTriangle,
    Circle,
    Award,
    Boxes,
    Weight,
    Container,
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
import type { SKU, Shipment, Supplier } from "@/lib/api/reference/use-reference-data";
import {
    skuDetailById,
    shipmentDetailById,
    supplierDetailById,
    type SKUDetail,
    type ShipmentDetail,
    type SupplierDetail,
} from "@/lib/api/ui/detail-data";

// ── Shared helpers ───────────────────────────────────────

const riskConfig = {
    critical: { color: "text-urgency-critical", bg: "bg-urgency-critical/15", border: "border-urgency-critical/30", glow: "shadow-urgency-critical/10" },
    high: { color: "text-urgency-critical", bg: "bg-urgency-critical/10", border: "border-urgency-critical/20", glow: "shadow-urgency-critical/5" },
    medium: { color: "text-urgency-warning", bg: "bg-urgency-warning/10", border: "border-urgency-warning/20", glow: "shadow-urgency-warning/5" },
    low: { color: "text-urgency-safe", bg: "bg-urgency-safe/10", border: "border-urgency-safe/20", glow: "shadow-urgency-safe/5" },
};

const statusConfig = {
    "in-transit": { color: "text-sky-400", bg: "bg-sky-400/10", label: "In Transit" },
    delayed: { color: "text-urgency-critical", bg: "bg-urgency-critical/10", label: "Delayed" },
    planned: { color: "text-muted-foreground", bg: "bg-muted/50", label: "Planned" },
    delivered: { color: "text-urgency-safe", bg: "bg-urgency-safe/10", label: "Delivered" },
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
    sku: SKU | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    if (!sku) return null;
    const detail: SKUDetail | undefined = skuDetailById[sku.id];
    const conf = riskConfig[sku.riskLevel];

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
                                        <span className="font-mono text-xs">{sku.id}</span>
                                        <span>·</span>
                                        <span>{sku.category}</span>
                                    </DialogDescription>
                                </div>
                                <Badge variant="outline" className={`${conf.bg} ${conf.color} ${conf.border} shrink-0`}>{sku.riskLevel} risk</Badge>
                            </div>
                        </DialogHeader>

                        {/* Risk Score Bar */}
                        <div className={`rounded-lg p-3 ${conf.bg} border ${conf.border}`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-muted-foreground">Risk Score</span>
                                <span className={`text-sm font-bold ${conf.color}`}>{sku.riskScore}/100</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-muted/50 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${sku.riskScore >= 70 ? "bg-urgency-critical" : sku.riskScore >= 40 ? "bg-urgency-warning" : "bg-urgency-safe"}`}
                                    style={{ width: `${sku.riskScore}%` }}
                                />
                            </div>
                        </div>

                        <Separator />

                        {/* Order Information */}
                        <div>
                            <SectionLabel>Order Information</SectionLabel>
                            <div className="grid grid-cols-2 gap-4">
                                <InfoRow icon={Boxes} label="Quantity On Hand" value={detail?.quantityOnHand?.toLocaleString() ?? "—"} />
                                <InfoRow icon={DollarSign} label="Unit Cost" value={detail ? `$${detail.unitCost.toFixed(2)}` : "—"} />
                                <InfoRow icon={Users} label="Vendor" value={detail?.vendor ?? "—"} />
                                <InfoRow icon={CalendarDays} label="Next Delivery" value={detail?.deliveryDate ?? "—"} />
                                <InfoRow icon={Clock} label="Lead Time" value={detail ? `${detail.leadTimeDays} days` : "—"} />
                                <InfoRow icon={DollarSign} label="Revenue" value={`$${(sku.revenue / 1_000).toFixed(0)}K`} />
                            </div>
                        </div>

                        <Separator />

                        {/* Specifications */}
                        {detail?.specifications && (
                            <div>
                                <SectionLabel>Specifications</SectionLabel>
                                <div className="rounded-lg border border-border/50 overflow-hidden">
                                    {[
                                        ["Dimensions", detail.specifications.dimensions],
                                        ["Weight", detail.specifications.weight],
                                        ["Material", detail.specifications.material],
                                        ["Operating Temp", detail.specifications.operatingTemp],
                                    ].map(([label, value], i) => (
                                        <div key={label} className={`flex items-center justify-between px-4 py-2.5 text-sm ${i % 2 === 0 ? "bg-muted/20" : "bg-transparent"}`}>
                                            <span className="text-muted-foreground">{label}</span>
                                            <span className="font-medium">{value}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex flex-wrap gap-1.5 mt-3">
                                    {detail.specifications.compliance.map((cert) => (
                                        <Badge key={cert} variant="outline" className="text-[10px] bg-muted/30">{cert}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Top Suppliers */}
                        {sku.topSuppliers.length > 0 && (
                            <>
                                <Separator />
                                <div>
                                    <SectionLabel>Top Suppliers</SectionLabel>
                                    <div className="flex flex-wrap gap-2">
                                        {sku.topSuppliers.map((s) => (
                                            <Badge key={s} variant="outline" className="bg-muted/30 text-xs">{s}</Badge>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Recent Orders */}
                        {detail?.recentOrders && detail.recentOrders.length > 0 && (
                            <>
                                <Separator />
                                <div>
                                    <SectionLabel>Recent Orders</SectionLabel>
                                    <div className="space-y-2">
                                        {detail.recentOrders.map((order) => (
                                            <div key={order.orderId} className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/10 px-4 py-2.5">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-mono font-medium">{order.orderId}</span>
                                                    <span className="text-[11px] text-muted-foreground">{order.date}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm">{order.quantity.toLocaleString()} units</span>
                                                    <Badge variant="outline" className={`text-[10px] ${order.status === "fulfilled" ? "bg-urgency-safe/10 text-urgency-safe" : order.status === "in-production" ? "bg-sky-400/10 text-sky-400" : "bg-urgency-warning/10 text-urgency-warning"}`}>
                                                        {order.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
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
    if (!shipment) return null;
    const detail: ShipmentDetail | undefined = shipmentDetailById[shipment.id];
    const conf = statusConfig[shipment.status];

    const customsColors = {
        cleared: "bg-urgency-safe/10 text-urgency-safe",
        pending: "bg-urgency-warning/10 text-urgency-warning",
        held: "bg-urgency-critical/10 text-urgency-critical",
    };

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
                                    <DialogTitle className="text-lg font-semibold">{shipment.id}</DialogTitle>
                                    <DialogDescription className="mt-1">
                                        <Badge variant="outline" className={`${conf.bg} ${conf.color}`}>{conf.label}</Badge>
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        {/* Route Visualization */}
                        <div className="rounded-lg border border-border/50 bg-muted/10 p-4">
                            <div className="flex items-center gap-4">
                                <div className="flex-1 text-center">
                                    <div className="text-[11px] text-muted-foreground mb-1">Origin</div>
                                    <div className="text-sm font-medium">{shipment.origin}</div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <div className="h-px w-8 bg-border" />
                                    <MapPin className="h-4 w-4 text-primary" />
                                    <div className="h-px w-8 bg-border" />
                                </div>
                                <div className="flex-1 text-center">
                                    <div className="text-[11px] text-muted-foreground mb-1">Destination</div>
                                    <div className="text-sm font-medium">{shipment.destination}</div>
                                </div>
                            </div>
                            <div className="text-center mt-3">
                                <span className="text-xs text-muted-foreground">ETA: </span>
                                <span className="text-xs font-medium">{shipment.eta}</span>
                            </div>
                        </div>

                        <Separator />

                        {/* Shipping Details */}
                        <div>
                            <SectionLabel>Shipping Details</SectionLabel>
                            <div className="grid grid-cols-2 gap-4">
                                <InfoRow icon={Truck} label="Carrier" value={shipment.carrier} />
                                <InfoRow icon={Container} label="Container" value={detail?.containerType ?? "—"} />
                                <InfoRow icon={Weight} label="Total Weight" value={detail?.totalWeight ?? "—"} />
                                <InfoRow icon={DollarSign} label="Declared Value" value={detail?.declaredValue ?? "—"} />
                            </div>
                        </div>

                        {/* Customs & SKUs */}
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <SectionLabel>Customs Status</SectionLabel>
                                <Badge variant="outline" className={`${customsColors[detail?.customsStatus ?? "pending"]} text-xs`}>
                                    {detail?.customsStatus === "cleared" ? "✓ Cleared" : detail?.customsStatus === "held" ? "⚠ Held" : "◷ Pending"}
                                </Badge>
                            </div>
                            <div>
                                <SectionLabel>SKUs in Shipment</SectionLabel>
                                <div className="flex flex-wrap gap-1.5">
                                    {shipment.skus.map((s) => (
                                        <Badge key={s} variant="outline" className="bg-muted/30 text-[10px] font-mono">{s}</Badge>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Documents */}
                        {detail?.documents && detail.documents.length > 0 && (
                            <>
                                <Separator />
                                <div>
                                    <SectionLabel>Documents</SectionLabel>
                                    <div className="flex flex-wrap gap-2">
                                        {detail.documents.map((doc) => (
                                            <div key={doc} className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/10 px-3 py-2 text-xs">
                                                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span>{doc}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Tracking Timeline */}
                        {detail?.trackingEvents && detail.trackingEvents.length > 0 && (
                            <>
                                <Separator />
                                <div>
                                    <SectionLabel>Tracking Timeline</SectionLabel>
                                    <div className="space-y-0">
                                        {detail.trackingEvents.map((event, i) => {
                                            const isFirst = i === 0;
                                            const isLast = i === detail.trackingEvents.length - 1;
                                            return (
                                                <div key={`${event.date}-${i}`} className="flex gap-4">
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
                                                        <div className="text-[11px] text-muted-foreground">{event.date} · {event.location}</div>
                                                        <div className="text-sm">{event.event}</div>
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

function ScoreGauge({ value, label, color }: { value: number; label: string; color: string }) {
    return (
        <div className="flex flex-col items-center gap-1.5 rounded-lg border border-border/50 bg-muted/10 p-3">
            <div className="relative h-12 w-12">
                <svg className="h-12 w-12 -rotate-90" viewBox="0 0 48 48">
                    <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" className="text-muted/30" strokeWidth="4" />
                    <circle
                        cx="24" cy="24" r="20" fill="none" stroke="currentColor"
                        className={color}
                        strokeWidth="4"
                        strokeDasharray={`${(value / 100) * 125.6} 125.6`}
                        strokeLinecap="round"
                    />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">{value}%</span>
            </div>
            <span className="text-[10px] text-muted-foreground text-center">{label}</span>
        </div>
    );
}

export function SupplierDetailModal({
    supplier,
    open,
    onOpenChange,
}: {
    supplier: Supplier | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    if (!supplier) return null;
    const detail: SupplierDetail | undefined = supplierDetailById[supplier.id];
    const conf = riskConfig[supplier.riskRating];

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
                                        <span>{supplier.region}</span>
                                    </DialogDescription>
                                </div>
                                <Badge variant="outline" className={`${conf.bg} ${conf.color} ${conf.border} shrink-0`}>{supplier.riskRating} risk</Badge>
                            </div>
                        </DialogHeader>

                        {/* Performance Metrics */}
                        {detail && (
                            <div className="grid grid-cols-3 gap-3">
                                <ScoreGauge
                                    value={detail.onTimeDeliveryRate}
                                    label="On-Time Delivery"
                                    color={detail.onTimeDeliveryRate >= 90 ? "text-urgency-safe" : detail.onTimeDeliveryRate >= 80 ? "text-urgency-warning" : "text-urgency-critical"}
                                />
                                <ScoreGauge
                                    value={detail.qualityScore}
                                    label="Quality Score"
                                    color={detail.qualityScore >= 90 ? "text-urgency-safe" : detail.qualityScore >= 80 ? "text-urgency-warning" : "text-urgency-critical"}
                                />
                                <div className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-border/50 bg-muted/10 p-3">
                                    <div className="flex gap-4">
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-foreground">{supplier.activeShipments}</div>
                                            <div className="text-[10px] text-muted-foreground">Active</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-foreground">{supplier.plannedShipments}</div>
                                            <div className="text-[10px] text-muted-foreground">Planned</div>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground">Shipments</span>
                                </div>
                            </div>
                        )}

                        <Separator />

                        {/* Contact Information */}
                        {detail && (
                            <div>
                                <SectionLabel>Contact Information</SectionLabel>
                                <div className="grid grid-cols-2 gap-4">
                                    <InfoRow icon={Users} label="Contact Person" value={detail.contactPerson} />
                                    <InfoRow icon={Phone} label="Phone" value={detail.phone} />
                                    <InfoRow icon={FileText} label="Contract Terms" value={detail.contractTerms} />
                                    <InfoRow icon={Shield} label="Risk Rating" value={`${supplier.riskRating} risk`} />
                                </div>
                            </div>
                        )}

                        {/* SKUs Supplied */}
                        {supplier.skus.length > 0 && (
                            <>
                                <Separator />
                                <div>
                                    <SectionLabel>SKUs Supplied</SectionLabel>
                                    <div className="flex flex-wrap gap-2">
                                        {supplier.skus.map((s) => (
                                            <Badge key={s} variant="outline" className="bg-muted/30 text-xs font-mono">{s}</Badge>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Certifications */}
                        {detail?.certifications && detail.certifications.length > 0 && (
                            <>
                                <Separator />
                                <div>
                                    <SectionLabel>Certifications</SectionLabel>
                                    <div className="flex flex-wrap gap-2">
                                        {detail.certifications.map((cert) => (
                                            <div key={cert} className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/10 px-3 py-2 text-xs">
                                                <Award className="h-3.5 w-3.5 text-urgency-safe" />
                                                <span>{cert}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Recent Orders */}
                        {detail?.recentOrders && detail.recentOrders.length > 0 && (
                            <>
                                <Separator />
                                <div>
                                    <SectionLabel>Recent Orders</SectionLabel>
                                    <div className="space-y-2">
                                        {detail.recentOrders.map((order) => (
                                            <div key={order.orderId} className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/10 px-4 py-2.5">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-mono font-medium">{order.orderId}</span>
                                                    <span className="text-[11px] text-muted-foreground">{order.date}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-medium">{order.value}</span>
                                                    <Badge variant="outline" className={`text-[10px] ${order.status === "delivered" ? "bg-urgency-safe/10 text-urgency-safe" : order.status === "in-transit" ? "bg-sky-400/10 text-sky-400" : "bg-urgency-warning/10 text-urgency-warning"}`}>
                                                        {order.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
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
