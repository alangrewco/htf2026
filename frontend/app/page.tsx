import { KPIBar } from "@/components/kpi-bar";
import { LiveSignals } from "@/components/live-signals";
import { ActionCardsCarousel } from "@/components/action-cards";
import { DataSection } from "@/components/data-section";

export default function Home() {
  return (
    <div className="snap-container">
      {/* ── Page 1: Command Center ─────────────────────────── */}
      <section className="snap-section flex flex-col pt-14">
        <div className="flex flex-1 gap-4 p-5 overflow-hidden">
          {/* Left: KPIs + Action Cards */}
          <div className="flex flex-1 flex-col gap-4 min-w-0">
            <KPIBar />
            <div className="flex-1 overflow-hidden">
              <ActionCardsCarousel />
            </div>
          </div>

          {/* Right: Live Signals */}
          <div className="hidden lg:flex w-[320px] shrink-0">
            <LiveSignals />
          </div>
        </div>
      </section>

      {/* ── Page 2: Data Explorer ──────────────────────────── */}
      <section className="snap-section pt-14">
        <DataSection />
      </section>
    </div>
  );
}
