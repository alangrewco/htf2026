"use client";

import { Package, Circle, Maximize2, X, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import type { Sku } from "@/sdk/model";
import { useReferenceData } from "@/lib/api/reference/use-reference-data";
import { riskConfig, statusConfig, InfoRow, SectionLabel } from "./detail-shared";

export function SKUDetailModal({
    sku,
    open,
    onOpenChange,
    onOpenSupplier,
    onOpenShipment,
}: {
    sku: Sku | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onOpenSupplier?: (id: string) => void;
    onOpenShipment?: (id: string) => void;
}) {
    const { supplierName, shipmentsBySku } = useReferenceData();
    const router = useRouter();
    if (!sku) return null;
    const conf = riskConfig[sku.risk_level as keyof typeof riskConfig] || riskConfig.medium;
    const skuShipments = shipmentsBySku.get(sku.id) || [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[85vh] p-0 overflow-hidden border-border/50 bg-card/95 backdrop-blur-xl flex flex-col" showCloseButton={false}>
                {/* Header Container */}
                <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-border/50 shrink-0">
                    <DialogHeader className="space-y-3 flex-1">
                        <div className="flex items-start gap-4">
                            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${conf.bg} ${conf.border} border`}>
                                <Package className={`h-5 w-5 ${conf.color}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <DialogTitle className="text-lg font-semibold">{sku.name}</DialogTitle>
                                    {sku.risk_score !== -1 && (
                                        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[10px] h-5 px-1.5 flex items-center gap-1 shrink-0">
                                            🔗 SAP
                                        </Badge>
                                    )}
                                </div>
                                <DialogDescription className="flex items-center gap-2 mt-1">
                                    <span className="font-mono text-xs">{sku.sku_code}</span>
                                    <span>·</span>
                                    <span>{sku.category}</span>
                                </DialogDescription>
                            </div>
                            <Badge variant="outline" className={`${conf.bg} ${conf.color} ${conf.border} shrink-0`}>{sku.risk_level} risk</Badge>
                        </div>
                    </DialogHeader>
                    {/* Expand and Close Buttons */}
                    <div className="flex items-center gap-1 shrink-0 ml-4">
                        <button
                            onClick={() => {
                                onOpenChange(false);
                                router.push(`/skus/${sku.id}`);
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

                        {/* Risk Score Bar */}
                        {sku.risk_score < 0 ? (
                            <div
                                onClick={() => {
                                    onOpenChange(false);
                                    router.push(`/skus/${sku.id}`);
                                }}
                                className="rounded-lg p-3 bg-muted/5 border border-border/50 cursor-pointer hover:bg-muted/10 transition-colors group flex items-center gap-3"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-medium text-muted-foreground">Risk Score</span>
                                        <span className="text-sm font-bold text-muted-foreground">Pending Analysis</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 h-2 rounded-full bg-muted/50 overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-500 bg-muted" style={{ width: "100%" }} />
                                        </div>
                                        <Button 
                                            size="sm" 
                                            variant="secondary" 
                                            className="h-7 text-[10px] shrink-0" 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onOpenChange(false);
                                                router.push("/jobs?openModal=true");
                                            }}
                                        >
                                            Start Analysis
                                        </Button>
                                    </div>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity shrink-0" />
                            </div>
                        ) : (
                            <div 
                                onClick={() => {
                                    onOpenChange(false);
                                    router.push(`/skus/${sku.id}`);
                                }}
                                className={`rounded-lg p-3 ${conf.bg} border ${conf.border} cursor-pointer hover:opacity-80 transition-opacity group flex items-center gap-3`}
                            >
                                <div className="flex-1">
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
                                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity shrink-0" />
                            </div>
                        )}

                        <Separator />

                        {/* SKU Information */}
                        <div>
                            <SectionLabel>SKU Details</SectionLabel>
                            <div className="grid grid-cols-2 gap-4">
                                <InfoRow icon={Package} label="Unit of Measure" value={sku.unit_of_measure} />
                                <InfoRow icon={Circle} label="Status" value={sku.status} />
                                <InfoRow icon={Package} label="Required Qty" value={sku.required_qty?.toString() || "0"} />
                            </div>
                        </div>

                        <Separator />

                        {/* Suppliers */}
                        {sku.supplier_ids && sku.supplier_ids.length > 0 && (
                            <>
                                <div>
                                    <SectionLabel>Suppliers</SectionLabel>
                                    <div className="flex flex-wrap gap-2">
                                        {sku.supplier_ids.map((sId) => (
                                            <Badge key={sId} variant="outline" className="bg-muted/30 text-xs cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => onOpenSupplier?.(sId)}>
                                                {supplierName(sId)}
                                            </Badge>
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
                                                <div key={shipment.id} className="cursor-pointer hover:bg-muted/20 transition-colors flex items-center justify-between rounded-lg border border-border/50 bg-muted/10 px-4 py-2.5" onClick={() => onOpenShipment?.(shipment.id)}>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm font-mono font-medium">{shipment.shipment_code}</span>
                                                        <Badge variant="outline" className="text-[10px] bg-muted/30">
                                                            Qty: {shipment.skus?.[sku.id] || 0}
                                                        </Badge>
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

                        {/* Quantity Tracking Checkout */}
                        {skuShipments.length > 0 && (() => {
                            let onTime = 0;
                            let planned = 0;
                            let delayed = 0;
                            skuShipments.forEach(s => {
                                const qty = s.skus?.[sku.id] || 0;
                                if (s.status === "in_transit" || s.status === "delivered") onTime += qty;
                                else if (s.status === "planned") planned += qty;
                                else if (s.status === "delayed") delayed += qty;
                            });
                            return (
                                <>
                                    <Separator />
                                    <div>
                                        <SectionLabel>Quantity Tracking</SectionLabel>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                                            <div className="rounded-lg border border-border/50 bg-muted/10 p-3 flex flex-col items-center justify-center">
                                                <div className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wide">Required</div>
                                                <div className="text-xl font-bold mt-1">{sku.required_qty || 0}</div>
                                            </div>
                                            <div className="rounded-lg border border-border/50 bg-urgency-safe/10 border-urgency-safe/20 p-3 flex flex-col items-center justify-center">
                                                <div className="text-[10px] uppercase text-urgency-safe font-semibold tracking-wide">On Time</div>
                                                <div className="text-xl font-bold text-urgency-safe mt-1">{onTime}</div>
                                            </div>
                                            <div className="rounded-lg border border-border/50 bg-primary/10 border-primary/20 p-3 flex flex-col items-center justify-center">
                                                <div className="text-[10px] uppercase text-primary font-semibold tracking-wide">Planned</div>
                                                <div className="text-xl font-bold text-primary mt-1">{planned}</div>
                                            </div>
                                            <div className="rounded-lg border border-border/50 bg-urgency-critical/10 border-urgency-critical/20 p-3 flex flex-col items-center justify-center">
                                                <div className="text-[10px] uppercase text-urgency-critical font-semibold tracking-wide">Delayed</div>
                                                <div className="text-xl font-bold text-urgency-critical mt-1">{delayed}</div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
