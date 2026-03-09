"use client";

import { Truck, Users, MapPin, Circle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Shipment } from "@/sdk/model";
import { ShipmentStatus } from "@/sdk/model";
import { useReferenceData } from "@/lib/api/reference/use-reference-data";
import { statusConfig, InfoRow, SectionLabel } from "./detail-shared";

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
