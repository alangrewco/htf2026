import { KPIBar } from "@/components/kpi-bar";
import { LiveSignals } from "@/components/live-signals";
import { ActionCardsSidebar } from "@/components/action-cards";
import { DataSection } from "@/components/data-section";
import { CommandBar } from "@/components/command-bar";
import { GeoPlaceholder } from "@/components/geo-placeholder";

export default function Home() {
  return (
    <div className="snap-container">
      {/* ── Page 1: Command Center ─────────────────────────── */}
      <section
        id="home-section"
        className="snap-section flex flex-col pt-14"
        style={{ height: "calc(100vh - 80px)" }}
      >
        {/* Three-column main area */}
        <div className="flex flex-1 gap-4 p-5 pb-2 min-h-0 overflow-hidden">
          {/* Left: Action Required sidebar */}
          <div className="flex h-full w-[340px] shrink-0 min-h-0">
            <ActionCardsSidebar />
          </div>

          {/* Center: KPI Bar + Geo Placeholder */}
          <div className="flex flex-1 flex-col gap-4 min-w-0 min-h-0">
            <div className="shrink-0">
              <KPIBar />
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <GeoPlaceholder />
            </div>
          </div>

          {/* Right: Live Signals */}
          <div className="flex h-full w-[340px] shrink-0 min-h-0">
            <LiveSignals />
          </div>
        </div>
      </section>

      {/* ── Shared Command Bar — sticky between pages ─────── */}
      <div className="sticky top-14 z-40">
        <CommandBar />
      </div>

      {/* ── Page 2: Data Explorer ──────────────────────────── */}
      <section
        id="data-explorer-section"
        className="snap-section"
      >
        <DataSection />
      </section>
    </div>
  );
}
