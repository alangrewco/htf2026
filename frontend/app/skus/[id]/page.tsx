"use client";

import { useParams, useRouter } from "next/navigation";
import { useReferenceData } from "@/lib/api/reference/use-reference-data";
import { Package, Circle, ArrowLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { riskConfig, statusConfig, InfoRow, SectionLabel } from "@/components/detail-shared";
import { NavbarSpacer, NAVBAR_HEIGHT_REM } from "@/components/navbar";

export default function SkuDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { skus, supplierName, shipmentsBySku } = useReferenceData();
    const sku = skus.find(s => s.id === id);

    if (!sku) {
        return (
            <div className="flex h-[80vh] items-center justify-center flex-col gap-4">
                <NavbarSpacer />
                <p className="text-muted-foreground text-sm">SKU not found.</p>
                <Button variant="outline" onClick={() => router.back()}>
                    Go back
                </Button>
            </div>
        );
    }

    const conf = riskConfig[sku.risk_level as keyof typeof riskConfig] || riskConfig.medium;
    const skuShipments = shipmentsBySku.get(sku.id) || [];

    return (
        <div className="flex flex-col h-screen">
            <NavbarSpacer />
            
            <div className="flex-1 min-h-0 max-w-4xl w-full mx-auto p-4 sm:p-6 md:p-8 flex flex-col">
                <button
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors w-max"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back
                </button>

                <div className="rounded-xl border border-border/50 bg-card/95 backdrop-blur-xl flex flex-col shadow-sm flex-1 min-h-0 overflow-hidden">
                    {/* Header Container */}
                    <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-border/50 shrink-0">
                        <div className="flex flex-col gap-2 text-center sm:text-left space-y-3 flex-1">
                            <div className="flex items-start gap-4">
                                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${conf.bg} ${conf.border} border`}>
                                    <Package className={`h-5 w-5 ${conf.color}`} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h2 className="text-lg leading-none font-semibold">{sku.name}</h2>
                                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                        <span className="font-mono text-xs">{sku.sku_code}</span>
                                        <span>·</span>
                                        <span>{sku.category}</span>
                                    </p>
                                </div>
                                <Badge variant="outline" className={`${conf.bg} ${conf.color} ${conf.border} shrink-0`}>{sku.risk_level} risk</Badge>
                            </div>
                        </div>
                    </div>

                    <ScrollArea className="flex-1 min-h-0">
                        <div className="p-6 space-y-6">
                            {/* Risk Score Bar */}
                            {sku.risk_score < 0 ? (
                                <div className="rounded-lg p-3 bg-muted/5 border border-border/50 flex items-center gap-3">
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
                                                onClick={() => {
                                                    router.push("/jobs?openModal=true");
                                                }}
                                            >
                                                Start Analysis
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className={`rounded-lg p-3 ${conf.bg} border ${conf.border} flex items-center gap-3`}>
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
                                                <Badge key={sId} variant="outline" className="bg-muted/30 text-xs">
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
                                                    <div key={shipment.id} className="cursor-pointer hover:bg-muted/20 transition-colors flex items-center justify-between rounded-lg border border-border/50 bg-muted/10 px-4 py-2.5" onClick={() => router.push(`/shipments/${shipment.id}`)}>
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
                </div>
            </div>
        </div>
    );
}
