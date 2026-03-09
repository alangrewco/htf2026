"use client";

import { Truck, Users, MapPin, CheckCircle2, ShieldCheck, Navigation, Anchor, PackageCheck, FileText, Maximize2, X, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Shipment } from "@/sdk/model";
import { ShipmentStatus } from "@/sdk/model";
import { useRouter } from "next/navigation";
import { useReferenceData } from "@/lib/api/reference/use-reference-data";
import { statusConfig, InfoRow, SectionLabel } from "./detail-shared";

function getEventIcon(type: string) {
    if (type.includes("order") || type.includes("booking")) return FileText;
    if (type.includes("depart")) return Anchor;
    if (type.includes("transit")) return Navigation;
    if (type.includes("arrive")) return MapPin;
    if (type.includes("customs")) return ShieldCheck;
    if (type.includes("deliver")) return PackageCheck;
    return CheckCircle2;
}

export function ShipmentDetailModal({
    shipment,
    open,
    onOpenChange,
    onOpenSku,
    onOpenSupplier,
}: {
    shipment: Shipment | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onOpenSku?: (id: string) => void;
    onOpenSupplier?: (id: string) => void;
}) {
    const router = useRouter();
    const { portName, skuName, supplierName } = useReferenceData();
    if (!shipment) return null;
    const conf = statusConfig[shipment.status] ?? statusConfig[ShipmentStatus.planned];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[85vh] p-0 overflow-hidden border-border/50 bg-card/95 backdrop-blur-xl flex flex-col" showCloseButton={false}>
                {/* Header Container */}
                <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-border/50 shrink-0">
                    <DialogHeader className="space-y-3 flex-1">
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
                    {/* Expand and Close Buttons */}
                    <div className="flex items-center gap-1 shrink-0 ml-4">
                        <button
                            onClick={() => {
                                onOpenChange(false);
                                router.push(`/shipments/${shipment.id}`);
                            }}
                            aria-label="Open full page"
                            className="flex h-7 w-7 items-center justify-center rounded-md opacity-70 text-foreground hover:opacity-100 hover:bg-accent/50 transition-opacity"
                        >
                            <Maximize2 className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => onOpenChange(false)}
                            aria-label="Close"
                            className="flex h-7 w-7 items-center justify-center rounded-md opacity-70 text-foreground hover:opacity-100 hover:bg-accent/50 transition-opacity"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <ScrollArea className="flex-1 min-h-0">
                    <div className="p-6 space-y-6">

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
                                <InfoRow icon={Users} label="Supplier" value={
                                    <span className="cursor-pointer hover:underline text-primary transition-colors" onClick={() => onOpenSupplier?.(shipment.supplier_id)}>
                                        {supplierName(shipment.supplier_id)}
                                    </span>
                                } />
                            </div>
                        </div>

                        {/* SKUs */}
                        <div>
                            <SectionLabel>SKUs in Shipment</SectionLabel>
                            <div className="flex flex-wrap gap-1.5">
                                {Object.entries(shipment.skus || {}).map(([skuId, qty]) => (
                                    <Badge key={skuId} variant="outline" className="bg-muted/30 text-[10px] font-mono cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => onOpenSku?.(skuId)}>
                                        {skuName(skuId)} (x{qty as number})
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
                                                const EventIcon = getEventIcon(event.type);
                                                return (
                                                    <div key={`${event.id}`} className="flex gap-4">
                                                        {/* Timeline connector */}
                                                        <div className="flex flex-col items-center">
                                                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isFirst ? "bg-primary text-primary-foreground ring-4 ring-primary/20" : "bg-muted/50 text-muted-foreground"}`}>
                                                                <EventIcon className="h-4 w-4" />
                                                            </div>
                                                            {!isLast && <div className="w-px flex-1 bg-border/60 my-2" />}
                                                        </div>
                                                        {/* Content */}
                                                        <div className={`pb-6 pt-1 ${isFirst ? "" : "opacity-70"}`}>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <div className={`text-sm font-semibold tracking-tight ${isFirst ? "text-foreground" : ""}`}>
                                                                    {event.description}
                                                                </div>
                                                                {event.status !== "ok" && (
                                                                    <Badge variant="outline" className="text-[10px] bg-urgency-warning/10 text-urgency-warning border-urgency-warning/20">
                                                                        {event.status}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div className="text-[11px] text-muted-foreground font-medium mb-0.5">
                                                                {new Date(event.event_time).toLocaleString(undefined, {
                                                                    weekday: 'short', month: 'short', day: 'numeric',
                                                                    hour: 'numeric', minute: '2-digit'
                                                                })}
                                                            </div>
                                                            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                                <MapPin className="h-3 w-3" />
                                                                {event.location}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            </>
                        )}

                        <Separator />
                        <Button
                            variant="ghost"
                            className="w-full justify-between text-xs text-muted-foreground hover:text-foreground border border-transparent hover:border-border/50"
                            onClick={() => {
                                onOpenChange(false);
                                router.push(`/shipments/${shipment.id}`);
                            }}
                        >
                            View detailed logistics & nearby events
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
