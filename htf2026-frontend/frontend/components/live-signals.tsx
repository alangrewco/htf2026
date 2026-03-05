"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Globe,
  CloudLightning,
  TrendingDown,
  Truck,
  HardHat,
  ExternalLink,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import type { Signal } from "@/lib/mock-data";
import { liveSignals } from "@/lib/mock-data";

const typeConfig: Record<
  Signal["type"],
  { icon: typeof Globe; color: string; label: string }
> = {
  geopolitical: { icon: Globe, color: "text-red-400", label: "Geopolitical" },
  weather: { icon: CloudLightning, color: "text-sky-400", label: "Weather" },
  financial: {
    icon: TrendingDown,
    color: "text-amber-400",
    label: "Financial",
  },
  logistics: { icon: Truck, color: "text-violet-400", label: "Logistics" },
  labor: { icon: HardHat, color: "text-orange-400", label: "Labor" },
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
    <div className="glass flex h-full flex-col rounded-xl overflow-hidden min-h-0">
      {/* Header */}
      <Link
        href="/news"
        className="flex items-center justify-between px-4 py-3 border-b border-border group"
      >
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-urgency-critical animate-pulse" />
          <h2 className="text-sm font-semibold">Live Signals</h2>
        </div>
        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-primary" />
      </Link>

      {/* Search */}
      <div className="px-3 pt-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter signals…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs bg-input/30 border-border/50"
          />
        </div>
      </div>

      {/* Type filters */}
      <div className="flex flex-wrap gap-1 px-3 py-2">
        {typeFilters.map((type) => {
          const conf = typeConfig[type];
          const active = activeFilter === type;
          return (
            <button
              key={type}
              onClick={() => setActiveFilter(active ? null : type)}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors cursor-pointer ${
                active
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <conf.icon className="h-2.5 w-2.5" />
              {conf.label}
            </button>
          );
        })}
      </div>

      {/* Signal feed */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-3 pb-3 min-h-0">
        <AnimatePresence mode="popLayout">
          {filtered.map((signal) => {
            const conf = typeConfig[signal.type];
            const Icon = conf.icon;
            return (
              <motion.div
                key={signal.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="group mb-2 rounded-lg border border-border/50 bg-card/50 p-3 transition-colors hover:bg-accent/50 cursor-pointer"
              >
                <Link href={`/news?item=${signal.id}`}>
                  <div className="flex items-start gap-2">
                    <Icon
                      className={`h-4 w-4 mt-0.5 shrink-0 ${conf.color}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium leading-tight line-clamp-2">
                        {signal.title}
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground line-clamp-2">
                        {signal.summary}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{signal.source}</span>
                        <span>·</span>
                        <span>{signal.timestamp}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {filtered.length === 0 && (
          <p className="py-8 text-center text-xs text-muted-foreground">
            No signals match your filters.
          </p>
        )}
      </div>
    </div>
  );
}
