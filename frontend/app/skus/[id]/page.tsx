"use client";

import { useParams, useRouter } from "next/navigation";
import { useReferenceData } from "@/lib/api/reference/use-reference-data";
import { Package, Circle, ArrowLeft, Truck } from "lucide-react";
import ReactMarkdown from "react-markdown";

const riskReports = {
    low: `**Risk Analysis Report**\n\n- Supplier reliability is high with a 98% on-time delivery rate over the past year.\n- No significant geopolitical or weather events currently impacting the main shipping routes ([Global Trade Monitor](#)).\n- Required quantities are well within the planned pipeline.\n- Inventory buffers are maintained at recommended levels.`,
    medium: `**Risk Analysis Report**\n\n- Minor delays observed in the main shipping route due to port congestion at the origin ([Port Authority Update](#)).\n- Some suppliers for this SKU have displayed slight variability in lead times during this season.\n- Remaining inventory can cover operations for the next 2 weeks, requiring close monitoring.\n- Alternative carrier options are available but may incur a premium fee ([Carrier Bulletin](#)).`,
    high: `**Risk Analysis Report**\n\n- **Critical Alert:** Major weather disruptions have halted shipments from the primary origin port ([Maritime Weather Service](#)).\n- Current inventory levels are dangerously low and cannot satisfy the required quantity for the next production cycle.\n- Secondary suppliers are also experiencing shortages due to raw material constraints ([Industry Supply Chain Report](#)).\n- Immediate action is required to expedite partial shipments or switch to alternative sourcing.`
};
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { riskConfig, statusConfig, InfoRow, SectionLabel } from "@/components/detail-shared";
import { NavbarSpacer } from "@/components/navbar";

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
            
            <div className="flex-1 min-h-0 max-w-[1400px] w-full mx-auto p-4 sm:p-6 md:p-8 flex flex-col">
                <button
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors w-max"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back
                </button>

                <div className="flex flex-col flex-1 min-h-0">
                    {/* Header Container */}
                    <div className="flex items-start justify-between pb-6 shrink-0 border-b border-border/50">
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

                    <div className="flex flex-1 min-h-0 min-w-0 flex-col md:flex-row pt-6">
                        {/* LEFT COLUMN - Details & Analytics */}
                        <ScrollArea className="flex-1 min-w-0 md:border-r border-border/50 md:pr-8">
                            <div className="pb-8 space-y-8">
                                {/* SKU Information */}
                                <div>
                                    <SectionLabel>SKU Details</SectionLabel>
                                    <div className="grid grid-cols-2 gap-4 mt-3">
                                        <InfoRow icon={Package} label="Unit of Measure" value={sku.unit_of_measure} />
                                        <InfoRow icon={Circle} label="Status" value={sku.status} />
                                        <InfoRow icon={Package} label="Required Qty" value={sku.required_qty?.toString() || "0"} />
                                    </div>
                                </div>

                                {/* Suppliers */}
                                {sku.supplier_ids && sku.supplier_ids.length > 0 && (
                                    <>
                                        <Separator className="bg-border/50" />
                                        <div>
                                            <SectionLabel>Suppliers</SectionLabel>
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {sku.supplier_ids.map((sId) => (
                                                    <Badge key={sId} variant="outline" className="bg-muted/30 text-xs py-1.5 px-3">
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
                                        <Separator className="bg-border/50" />
                                        <div>
                                            <SectionLabel>Associated Shipments</SectionLabel>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                                                {skuShipments.map((shipment) => {
                                                    const shipmentConf = statusConfig[shipment.status];
                                                    const latestEvent = shipment.events && shipment.events.length > 0 
                                                        ? shipment.events[shipment.events.length - 1] 
                                                        : null;
                                                    return (
                                                        <div key={shipment.id} onClick={() => router.push(`/shipments/${shipment.id}`)} className="cursor-pointer group flex flex-col rounded-xl border border-border/50 bg-card p-4 hover:border-border hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-ring gap-2">
                                                            <div className="flex items-start justify-between mb-3">
                                                                <div className="flex items-center gap-2">
                                                                    <Truck className="h-4 w-4 text-muted-foreground" />
                                                                    <span className="text-sm font-semibold">{shipment.shipment_code}</span>
                                                                </div>
                                                                <Badge variant="outline" className={`text-[10px] ${shipmentConf?.bg} ${shipmentConf?.color}`}>
                                                                    {shipmentConf?.label || shipment.status}
                                                                </Badge>
                                                            </div>
                                                            {latestEvent && (
                                                                <div className="text-xs text-muted-foreground/80 line-clamp-1 mb-1">
                                                                    <span className="font-medium text-muted-foreground">{latestEvent.location}</span> &middot; {latestEvent.status}
                                                                </div>
                                                            )}
                                                            <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
                                                                <span>Qty: <span className="font-medium text-foreground">{shipment.skus?.[sku.id] || 0}</span></span>
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
                                            <Separator className="bg-border/50" />
                                            <div>
                                                <SectionLabel>Quantity Tracking</SectionLabel>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                                                    <div className="rounded-xl border border-border/50 bg-muted/10 p-4 flex flex-col items-center justify-center">
                                                        <div className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wide">Required</div>
                                                        <div className="text-xl font-bold mt-1.5">{sku.required_qty || 0}</div>
                                                    </div>
                                                    <div className="rounded-xl border border-border/50 bg-urgency-safe/10 border-urgency-safe/20 p-4 flex flex-col items-center justify-center">
                                                        <div className="text-[10px] uppercase text-urgency-safe font-semibold tracking-wide">On Time</div>
                                                        <div className="text-xl font-bold text-urgency-safe mt-1.5">{onTime}</div>
                                                    </div>
                                                    <div className="rounded-xl border border-border/50 bg-primary/10 border-primary/20 p-4 flex flex-col items-center justify-center">
                                                        <div className="text-[10px] uppercase text-primary font-semibold tracking-wide">Planned</div>
                                                        <div className="text-xl font-bold text-primary mt-1.5">{planned}</div>
                                                    </div>
                                                    <div className="rounded-xl border border-border/50 bg-urgency-critical/10 border-urgency-critical/20 p-4 flex flex-col items-center justify-center">
                                                        <div className="text-[10px] uppercase text-urgency-critical font-semibold tracking-wide">Delayed</div>
                                                        <div className="text-xl font-bold text-urgency-critical mt-1.5">{delayed}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </ScrollArea>

                        {/* RIGHT COLUMN - Risk Analysis */}
                        <ScrollArea className="w-full md:w-[45%] shrink-0 min-w-0 md:pl-8">
                            <div className="pb-8 space-y-6">
                                {/* Risk Score Bar */}
                                {sku.risk_score < 0 ? (
                                    <div className="rounded-xl p-4 md:p-5 bg-card border border-border/50 flex items-center gap-3 shadow-sm">
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Risk Score</span>
                                                <span className="text-sm font-bold text-muted-foreground">Pending Analysis</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex-1 h-3 rounded-full bg-muted/50 overflow-hidden">
                                                    <div className="h-full rounded-full transition-all duration-500 bg-muted" style={{ width: "100%" }} />
                                                </div>
                                                <Button 
                                                    size="sm" 
                                                    variant="secondary" 
                                                    className="h-8 text-xs shrink-0" 
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
                                    <div className={`rounded-xl p-4 md:p-5 ${conf.bg} border ${conf.border} flex items-center gap-3 shadow-sm`}>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Risk Score</span>
                                                <span className={`text-sm font-bold ${conf.color}`}>{sku.risk_score}/100</span>
                                            </div>
                                            <div className="h-3 w-full rounded-full bg-muted/50 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${sku.risk_score >= 70 ? "bg-urgency-critical" : sku.risk_score >= 40 ? "bg-urgency-warning" : "bg-urgency-safe"}`}
                                                    style={{ width: `${sku.risk_score}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Risk Report */}
                                {sku.risk_score >= 0 && (
                                    <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 mt-2">
                                        <ReactMarkdown
                                            components={{
                                                /* eslint-disable @typescript-eslint/no-unused-vars */
                                                a: ({ node, ...props }) => <a {...props} className="text-primary hover:underline font-medium" target="_blank" rel="noopener noreferrer" />,
                                                ul: ({ node, ...props }) => <ul {...props} className="pl-5 space-y-2 mt-4 list-disc" />,
                                                li: ({ node, ...props }) => <li {...props} className="leading-relaxed text-sm" />,
                                                strong: ({ node, ...props }) => <strong {...props} className="text-foreground" />,
                                                p: ({ node, ...props }) => <p {...props} className="mb-4 text-sm" />
                                                /* eslint-enable @typescript-eslint/no-unused-vars */
                                            }}
                                        >
                                            {sku.risk_score >= 70 ? riskReports.high : sku.risk_score >= 40 ? riskReports.medium : riskReports.low}
                                        </ReactMarkdown>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            </div>
        </div>
    );
}
