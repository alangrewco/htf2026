"use client";

import { DollarSign, AlertTriangle, Package } from "lucide-react";
import Link from "next/link";
import { kpiData } from "@/lib/mock-data";

const kpis = [
  {
    label: "Revenue at Risk",
    value: `$${(kpiData.revenueAtRisk / 1_000_000).toFixed(1)}M`,
    icon: DollarSign,
    accentColor: "#c4444a",
  },
  {
    label: "Active Disruptions",
    value: kpiData.activeDisruptions.toString(),
    icon: AlertTriangle,
    accentColor: "#d4a84a",
  },
  {
    label: "Affected SKUs",
    value: `${kpiData.affectedSKUs} / ${kpiData.totalSKUs}`,
    icon: Package,
    accentColor: "#e8c872",
  },
];

export function KPIBar() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-px" style={{ background: "rgba(228,224,216,0.06)" }}>
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Link key={kpi.label} href="/dashboard/analytics">
            <div
              className="relative flex items-center gap-4 p-4 transition-colors duration-200 cursor-pointer"
              style={{ background: "#0c0c12" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#111118"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#0c0c12"; }}
            >
              {/* Left accent bar */}
              <div
                className="absolute left-0 top-2 bottom-2 w-0.5"
                style={{ background: kpi.accentColor }}
              />
              <Icon className="h-4 w-4 shrink-0" style={{ color: kpi.accentColor }} />
              <div className="flex flex-col">
                <span className="text-[11px] font-medium tracking-wide uppercase" style={{ color: "#6b6b78" }}>
                  {kpi.label}
                </span>
                <span className="text-2xl font-extralight tracking-tight" style={{ color: "#e4e0d8" }}>
                  {kpi.value}
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
