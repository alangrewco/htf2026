"use client";

import { motion } from "framer-motion";
import { DollarSign, AlertTriangle, Package } from "lucide-react";
import Link from "next/link";
import { mockKPIData, useKpiData } from "@/lib/api/ui/kpis";

export function KPIBar() {
  const { data: kpiData = mockKPIData } = useKpiData();

  const kpis = [
    {
      label: "Revenue at Risk",
      value: `$${(kpiData.revenueAtRisk / 1_000_000).toFixed(1)}M`,
      icon: DollarSign,
      color: "text-urgency-critical",
      bgColor: "bg-urgency-critical/10",
      borderColor: "border-urgency-critical/20",
    },
    {
      label: "Active Disruptions",
      value: kpiData.activeDisruptions.toString(),
      icon: AlertTriangle,
      color: "text-urgency-warning",
      bgColor: "bg-urgency-warning/10",
      borderColor: "border-urgency-warning/20",
    },
    {
      label: "Affected SKUs",
      value: `${kpiData.affectedSKUs} / ${kpiData.totalSKUs}`,
      icon: Package,
      color: "text-urgency-info",
      bgColor: "bg-urgency-info/10",
      borderColor: "border-urgency-info/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {kpis.map((kpi, i) => {
        const Icon = kpi.icon;
        return (
          <Link key={kpi.label} href="/analytics">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className={`group relative flex items-center gap-3 rounded-xl border ${kpi.borderColor} ${kpi.bgColor} p-4 transition-all duration-200 hover:scale-[1.02] hover:border-opacity-40 cursor-pointer`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${kpi.bgColor} ${kpi.color}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-muted-foreground">
                  {kpi.label}
                </span>
                <span className={`text-xl font-bold ${kpi.color}`}>
                  {kpi.value}
                </span>
              </div>
              {/* Glow effect on hover */}
              <div
                className={`absolute inset-0 rounded-xl ${kpi.bgColor} opacity-0 group-hover:opacity-100 transition-opacity blur-xl -z-10`}
              />
            </motion.div>
          </Link>
        );
      })}
    </div>
  );
}
