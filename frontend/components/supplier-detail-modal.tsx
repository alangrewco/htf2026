"use client";

import { Users, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Supplier } from "@/sdk/model";
import { ShipmentStatus } from "@/sdk/model";
import { useReferenceData } from "@/lib/api/reference/use-reference-data";
import { riskConfig, statusConfig, SectionLabel } from "./detail-shared";

export function SupplierDetailModal({
    supplier,
    open,
    onOpenChange,
    onOpenSku,
    onOpenShipment,
}: {
    supplier: Supplier | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onOpenSku?: (id: string) => void;
    onOpenShipment?: (id: string) => void;
}) {
    const { skus, shipmentsBySupplier } = useReferenceData();
    if (!supplier) return null;
    const conf = riskConfig[supplier.risk_rating as keyof typeof riskConfig] || riskConfig.medium;
    const supplierSkus = skus.filter((sku) => sku.supplier_ids.includes(supplier.id));
    const supplierShipments = shipmentsBySupplier.get(supplier.id) || [];
    
    const activeShipments = supplierShipments.filter(s => s.status === ShipmentStatus.in_transit).length;
    const plannedShipments = supplierShipments.filter(s => s.status === ShipmentStatus.planned).length;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[85vh] p-0 overflow-hidden border-border/50 bg-card/95 backdrop-blur-xl">
                <ScrollArea className="max-h-[85vh]">
                    <div className="pt-10 px-6 pb-6 space-y-6">
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
                                            <Badge key={s.id} variant="outline" className="bg-muted/30 text-xs cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => onOpenSku?.(s.id)}>{s.name}</Badge>
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
                                                    <div key={shipment.id} className="cursor-pointer hover:bg-muted/20 flex items-center justify-between rounded-lg border border-border/50 bg-muted/10 px-4 py-2.5 transition-colors" onClick={() => onOpenShipment?.(shipment.id)}>
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
