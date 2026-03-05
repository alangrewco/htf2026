"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Globe,
  CloudLightning,
  TrendingDown,
  Truck,
  HardHat,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import type { Signal } from "@/lib/mock-data";
import { liveSignals } from "@/lib/mock-data";

const typeConfig: Record<
  Signal["type"],
  { icon: typeof Globe; color: string; label: string }
> = {
  geopolitical: { icon: Globe, color: "#c4444a", label: "Geopolitical" },
  weather: { icon: CloudLightning, color: "#7296c4", label: "Weather" },
  financial: { icon: TrendingDown, color: "#d4a84a", label: "Financial" },
  logistics: { icon: Truck, color: "#9b7bc4", label: "Logistics" },
  labor: { icon: HardHat, color: "#c49672", label: "Labor" },
};

const typeFilters = Object.keys(typeConfig) as Signal["type"][];

export function LiveSignals() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<Signal["type"] | null>(null);

  const filtered = useMemo(() => {
    return liveSignals.filter((s) => {
      const matchesSearch =
        !search ||
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.summary.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = !activeFilter || s.type === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [search, activeFilter]);

  return (
    <div
      className="flex h-full flex-col overflow-hidden min-h-0"
      style={{ borderLeft: "1px solid rgba(228,224,216,0.06)" }}
    >
      {/* Header */}
      <Link
        href="/dashboard/news"
        className="flex items-center justify-between px-4 py-3 group transition-colors"
        style={{ borderBottom: "1px solid rgba(228,224,216,0.06)" }}
      >
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full" style={{ background: "#c4444a" }} />
          <h2 className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#e4e0d8" }}>
            Live Signals
          </h2>
        </div>
        <ExternalLink className="h-3.5 w-3.5 transition-colors" style={{ color: "#3a3a44" }} />
      </Link>

      {/* Search */}
      <div className="px-4 pt-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: "#3a3a44" }} />
          <input
            placeholder="Filter signals…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full pl-8 text-xs bg-transparent outline-none"
            style={{
              color: "#e4e0d8",
              borderBottom: "1px solid rgba(228,224,216,0.08)",
            }}
          />
        </div>
      </div>

      {/* Type filters */}
      <div className="flex flex-wrap gap-1 px-4 py-2">
        {typeFilters.map((type) => {
          const conf = typeConfig[type];
          const active = activeFilter === type;
          return (
            <button
              key={type}
              onClick={() => setActiveFilter(active ? null : type)}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium transition-colors cursor-pointer"
              style={{
                color: active ? conf.color : "#6b6b78",
                borderBottom: active ? `1px solid ${conf.color}` : "1px solid transparent",
              }}
            >
              <conf.icon className="h-2.5 w-2.5" />
              {conf.label}
            </button>
          );
        })}
      </div>

      {/* Signal feed */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-3 min-h-0">
        {filtered.map((signal) => {
          const conf = typeConfig[signal.type];
          const Icon = conf.icon;
          return (
            <div
              key={signal.id}
              className="group py-3 transition-colors cursor-pointer"
              style={{ borderBottom: "1px solid rgba(228,224,216,0.04)" }}
            >
              <Link href={`/dashboard/news?item=${signal.id}`}>
                <div className="flex items-start gap-3">
                  <Icon
                    className="h-3.5 w-3.5 mt-0.5 shrink-0"
                    style={{ color: conf.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium leading-tight line-clamp-2" style={{ color: "#e4e0d8" }}>
                      {signal.title}
                    </p>
                    <p className="mt-1 text-[10px] line-clamp-2" style={{ color: "#6b6b78" }}>
                      {signal.summary}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2 text-[10px]" style={{ color: "#3a3a44" }}>
                      <span>{signal.source}</span>
                      <span>·</span>
                      <span>{signal.timestamp}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-xs" style={{ color: "#6b6b78" }}>
            No signals match your filters.
          </p>
        )}
      </div>
    </div>
  );
}
