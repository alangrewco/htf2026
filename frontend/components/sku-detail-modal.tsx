"use client";

import { Package, Circle } from "lucide-react";
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
}: {
    sku: Sku | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { supplierNamesForSku, shipmentsBySku } = useReferenceData();
    const router = useRouter();
    if (!sku) return null;
    const conf = riskConfig[sku.risk_level as keyof typeof riskConfig] || riskConfig.medium;
    const supplierNames = supplierNamesForSku(sku.id);
    const skuShipments = shipmentsBySku.get(sku.id) || [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[85vh] p-0 overflow-hidden border-border/50 bg-card/95 backdrop-blur-xl">
                <ScrollArea className="max-h-[85vh]">
                    <div className="pt-10 px-6 pb-6 space-y-6">
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
                        {sku.risk_score < 0 ? (
                            <div className="rounded-lg p-3 bg-muted/5 border border-border/50">
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
                                        onClick={() => {
                                            onOpenChange(false);
                                            router.push("/jobs?openModal=true");
                                        }}
                                    >
                                        Start Analysis
                                    </Button>
                                </div>
                            </div>
                        ) : (
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
                        )}

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
