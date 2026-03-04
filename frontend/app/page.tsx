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
        className="snap-section flex flex-col pt-14 h-screen overflow-hidden"
      >
        {/* Three-column main area — must never exceed remaining height */}
        <div className="flex flex-1 gap-4 p-5 min-h-0 overflow-hidden">
          {/* Left: Action Required sidebar */}
          <div className="flex w-[260px] shrink-0 min-h-0">
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
          <div className="flex w-[260px] shrink-0 min-h-0">
            <LiveSignals />
          </div>
        </div>

        {/* Bottom: Command Bar pinned to bottom of page 1 */}
        <div className="px-5 pb-4 shrink-0">
          <CommandBar variant="page1" />
        </div>
      </section>

      {/* ── Page 2: Data Explorer ──────────────────────────── */}
      <section id="data-explorer-section" className="snap-section pt-14">
        <DataSection />
      </section>
    </div>
  );
}

