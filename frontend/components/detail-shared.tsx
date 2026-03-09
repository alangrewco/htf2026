"use client";

import { ShipmentStatus } from "@/sdk/model";

export const riskConfig = {
    critical: { color: "text-urgency-critical", bg: "bg-urgency-critical/15", border: "border-urgency-critical/30", glow: "shadow-urgency-critical/10" },
    high: { color: "text-urgency-critical", bg: "bg-urgency-critical/10", border: "border-urgency-critical/20", glow: "shadow-urgency-critical/5" },
    medium: { color: "text-urgency-warning", bg: "bg-urgency-warning/10", border: "border-urgency-warning/20", glow: "shadow-urgency-warning/5" },
    low: { color: "text-urgency-safe", bg: "bg-urgency-safe/10", border: "border-urgency-safe/20", glow: "shadow-urgency-safe/5" },
};

export const statusConfig: Record<ShipmentStatus, { color: string; bg: string; label: string }> = {
    [ShipmentStatus.in_transit]: { color: "text-sky-400", bg: "bg-sky-400/10", label: "In Transit" },
    [ShipmentStatus.delayed]: { color: "text-urgency-critical", bg: "bg-urgency-critical/10", label: "Delayed" },
    [ShipmentStatus.planned]: { color: "text-muted-foreground", bg: "bg-muted/50", label: "Planned" },
    [ShipmentStatus.delivered]: { color: "text-urgency-safe", bg: "bg-urgency-safe/10", label: "Delivered" },
    [ShipmentStatus.cancelled]: { color: "text-muted-foreground", bg: "bg-muted/50", label: "Cancelled" },
};

export function InfoRow({ icon: Icon, label, value, className = "" }: { icon: React.ElementType; label: string; value: React.ReactNode; className?: string }) {
    return (
        <div className={`flex items-start gap-3 ${className}`}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
                <div className="text-[11px] text-muted-foreground">{label}</div>
                <div className="text-sm font-medium">{value}</div>
            </div>
        </div>
    );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
    return <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">{children}</h4>;
}
