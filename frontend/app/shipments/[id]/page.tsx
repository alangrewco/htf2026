"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useReferenceData } from "@/lib/api/reference/use-reference-data";
// import { useListArticles } from "@/sdk/articles/articles";
import { Truck, Users, MapPin, CheckCircle2, ShieldCheck, Navigation, Anchor, PackageCheck, FileText, ArrowLeft, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { statusConfig, InfoRow, SectionLabel } from "@/components/detail-shared";
import { NavbarSpacer } from "@/components/navbar";
import { ShipmentStatus } from "@/sdk/model";
import { ROUTE_PATHS } from "@/lib/fixtures/reference/routes";
import { ShipmentMap } from "@/components/shipment-map";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { SKUDetailModal, SupplierDetailModal } from "@/components/detail-modals";
import type { Sku, Supplier } from "@/sdk/model";
import { mockArticleListResponse } from "@/lib/fixtures/articles";

const HARDCODED_GEO = [
  { match: "Houston", lat: 29.7604, lng: -95.3698 },
  { match: "South China Sea", lat: 14.0, lng: 114.0, orMatch: "Shenzhen" },
  { match: "EU Carbon", lat: 50.8503, lng: 4.3517 },
  { match: "Red Sea", lat: 12.6, lng: 43.3 },
  { match: "Panama Canal", lat: 9.1012, lng: -79.4029 },
  { match: "Bangladesh", lat: 23.8103, lng: 90.4125 },
];

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getEventIcon(type: string) {
    if (type.includes("order") || type.includes("booking")) return FileText;
    if (type.includes("depart")) return Anchor;
    if (type.includes("transit")) return Navigation;
    if (type.includes("arrive")) return MapPin;
    if (type.includes("customs")) return ShieldCheck;
    if (type.includes("deliver")) return PackageCheck;
    return CheckCircle2;
}

export default function ShipmentDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { shipments, portName, skuName, supplierName, supplierMap, skuMap } = useReferenceData();
    // const { data: articlesResponse } = useListArticles();
    
    // Always use mock data to ensure the map demo always has nearby alerts.
    // In a real scenario, this page would depend mostly on articles returned from a real query
    // involving the geolocation logic.
    const actualArticlesResponse = useMemo(() => ({ data: mockArticleListResponse }), []);
    
    const [selectedSku, setSelectedSku] = useState<Sku | null>(null);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    
    const shipment = shipments.find(s => s.id === id);

    const routeNodes = useMemo(() => {
        return shipment?.route_id ? ROUTE_PATHS[shipment.route_id] || [] : [];
    }, [shipment]);
    
    // Pick middle point for shipment location if no live tracking
    const shipLocation = useMemo(() => {
        if (routeNodes.length === 0) return null;
        return routeNodes[Math.floor(routeNodes.length / 2)];
    }, [routeNodes]);

    const articlesWithGeo = useMemo(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items = ((actualArticlesResponse?.data as any)?.items) || [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return items.map((a: any) => {
            const geo = HARDCODED_GEO.find(g => a.title.includes(g.match) || (g.orMatch && a.title.includes(g.orMatch)));
            return {
                ...a,
                lat: geo?.lat ?? 0,
                lng: geo?.lng ?? 0,
                hasGeo: !!geo,
                // generate a 'timestamp' string for map popup
                timestamp: format(new Date(a.published_at), "MMM d, HH:mm"),
                distance: (shipLocation && geo) ? getDistance(shipLocation.lat, shipLocation.lng, geo.lat, geo.lng) : 999999
            };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }).filter((a: any) => a.hasGeo).sort((a: any, b: any) => a.distance - b.distance);
    }, [actualArticlesResponse, shipLocation]);

    if (!shipment) {
        return (
            <div className="flex h-[80vh] items-center justify-center flex-col gap-4">
                <NavbarSpacer />
                <p className="text-muted-foreground text-sm">Shipment not found.</p>
                <Button variant="outline" onClick={() => router.back()}>
                    Go back
                </Button>
            </div>
        );
    }

    const conf = statusConfig[shipment.status] ?? statusConfig[ShipmentStatus.planned];

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            <NavbarSpacer />
            
            <div className="flex-1 min-h-0 max-w-[1500px] w-full mx-auto p-4 sm:p-6 md:p-8 flex flex-col">
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
                                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${conf.bg} border ${conf.color.replace('text-', 'border-')}/30`}>
                                    <Truck className={`h-5 w-5 ${conf.color}`} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-xl leading-none font-bold tracking-tight">{shipment.shipment_code}</h2>
                                        {((shipment as { risk_score?: number }).risk_score !== -1) && (
                                            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[10px] h-5 px-1.5 flex items-center gap-1 shrink-0">
                                                🔗 SAP
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-2">
                                        <Badge variant="outline" className={`${conf.bg} ${conf.color}`}>{conf.label}</Badge>
                                        <span>·</span>
                                        <span>Expected: {new Date(shipment.expected_delivery_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-1 min-h-0 min-w-0 flex-col md:flex-row pt-6">
                        {/* LEFT COLUMN - Shipment Details & Timeline */}
                        <ScrollArea className="flex-1 min-w-0 md:border-r border-border/50 md:pr-8">
                            <div className="pb-8 space-y-8 pr-4 md:pr-0">
                                {/* Route Overview */}
                                <div>
                                    <SectionLabel>Route Overview</SectionLabel>
                                    <div className="rounded-lg border border-border/50 bg-muted/10 p-4 mt-3">
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 text-center truncate">
                                                <div className="text-[11px] text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Origin</div>
                                                <div className="text-sm font-medium">{portName(shipment.origin_port_id)}</div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <div className="h-px w-8 bg-border" />
                                                <Navigation className="h-4 w-4 text-primary" />
                                                <div className="h-px w-8 bg-border" />
                                            </div>
                                            <div className="flex-1 text-center truncate">
                                                <div className="text-[11px] text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Destination</div>
                                                <div className="text-sm font-medium">{portName(shipment.destination_port_id)}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Separator className="bg-border/50" />

                                {/* Shipping Details */}
                                <div>
                                    <SectionLabel>Carrier & Supplier</SectionLabel>
                                    <div className="grid grid-cols-2 gap-4 mt-3">
                                        <InfoRow icon={Anchor} label="Carrier" value={shipment.carrier || "—"} />
                                        <InfoRow icon={Users} label="Supplier" value={
                                            <span className="hover:underline cursor-pointer text-primary" onClick={() => setSelectedSupplier(supplierMap.get(shipment.supplier_id) || null)}>{supplierName(shipment.supplier_id)}</span>
                                        } />
                                    </div>
                                </div>

                                {/* SKUs */}
                                <div>
                                    <SectionLabel>Manifest Items</SectionLabel>
                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                        {Object.entries(shipment.skus || {}).map(([skuId, qty]) => (
                                            <Badge key={skuId} variant="outline" className="bg-muted/30 text-xs py-1.5 px-3 cursor-pointer hover:bg-muted/50 transition-colors border-border/60" onClick={() => setSelectedSku(skuMap.get(skuId) || null)}>
                                                {skuName(skuId)} <span className="text-muted-foreground ml-1">(x{qty as number})</span>
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                {/* Tracking Timeline */}
                                {shipment.events && shipment.events.length > 0 && (
                                    <>
                                        <Separator className="bg-border/50" />
                                        <div>
                                            <SectionLabel>Tracking History</SectionLabel>
                                            <div className="space-y-0 mt-4">
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
                            </div>
                        </ScrollArea>

                        {/* RIGHT COLUMN - Map & Alerts */}
                        <ScrollArea className="w-full md:w-[45%] lg:w-[50%] shrink-0 min-w-0 md:pl-8 mt-8 md:mt-0">
                            <div className="pb-8 flex flex-col gap-6">
                                {/* Geographic Map */}
                                <div>
                                    <SectionLabel>Live Geographic Overview</SectionLabel>
                                    <div className="mt-3 aspect-[4/3] w-full bg-muted/20 rounded-xl relative overflow-hidden ring-1 ring-border/50">
                                        <ShipmentMap 
                                           routeNodes={routeNodes} 
                                           shipLocation={shipLocation} 
                                           articlesWithGeo={articlesWithGeo} 
                                        />
                                    </div>
                                    <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground px-1">
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Ship Location</span>
                                            <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-destructive" /> Active Alerts</span>
                                        </div>
                                    </div>
                                </div>

                                <Separator className="bg-border/50" />

                                {/* Event Feed List sorted by distance */}
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <SectionLabel>Proximity Alerts Feed</SectionLabel>
                                        <span className="text-xs text-muted-foreground">Sorted by distance</span>
                                    </div>
                                    
                                    <div className="flex flex-col gap-3">
                                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                        {articlesWithGeo.map((article: any) => (
                                            <Card key={article.id} className="cursor-pointer group hover:bg-muted/30 transition-colors border-border/60">
                                                <CardContent className="p-4 flex flex-col gap-2">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-center gap-2">
                                                            <Radio className="h-4 w-4 text-destructive animate-pulse" />
                                                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider truncate">
                                                                {article.source}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className="text-[10px] bg-background font-mono opacity-80">
                                                                {Math.round(article.distance)} km away
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <h3 className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors mt-1">
                                                        {article.headline}
                                                    </h3>
                                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                                        {article.preview_text}
                                                    </p>
                                                    <div className="mt-2 text-xs text-muted-foreground flex items-center justify-between">
                                                        <span>{format(new Date(article.published_at), "MMM d, HH:mm")}</span>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                        {articlesWithGeo.length === 0 && (
                                            <div className="text-center p-8 bg-muted/10 rounded-lg border border-border/50 text-muted-foreground">
                                                <MapPin className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                                <p className="text-sm">No nearby alerts detected.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            </div>

            {/* Modals from connections */}
            <SKUDetailModal
                sku={selectedSku}
                open={!!selectedSku}
                onOpenChange={(o) => !o && setSelectedSku(null)}
                // We're already on the shipment page, so if they click a shipment from a SKU modal, just navigate there!
                onOpenShipment={(id) => { setSelectedSku(null); router.push(`/shipments/${id}`); }}
                onOpenSupplier={(id) => { setSelectedSku(null); setSelectedSupplier(supplierMap.get(id) || null); }}
            />
            <SupplierDetailModal
                supplier={selectedSupplier}
                open={!!selectedSupplier}
                onOpenChange={(o) => !o && setSelectedSupplier(null)}
                onOpenSku={(id) => { setSelectedSupplier(null); setSelectedSku(skuMap.get(id) || null); }}
                onOpenShipment={(id) => { setSelectedSupplier(null); router.push(`/shipments/${id}`); }}
            />
        </div>
    );
}
