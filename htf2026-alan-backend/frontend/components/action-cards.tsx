"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  Shield,
  Bot,
  Clock,
  DollarSign,
  Package,
  X,
} from "lucide-react";
import type { ActionCard, ActionCardType } from "@/lib/mock-data";
import { actionCards } from "@/lib/mock-data";

/* ── Dismiss confirm dialog ──────────────────────────────── */

function DismissConfirmDialog({
  open,
  cardTitle,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  cardTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (typeof window === "undefined" || !open) return null;
  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[70]"
        style={{ background: "rgba(0,0,0,0.6)" }}
        onClick={onCancel}
      />
      {/* Dialog */}
      <div
        className="fixed left-1/2 top-1/2 z-[71] -translate-x-1/2 -translate-y-1/2 w-[340px] p-5"
        style={{
          background: "#111118",
          border: "1px solid rgba(228,224,216,0.08)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: "#c4444a" }} />
          <span className="text-sm font-semibold" style={{ color: "#e4e0d8" }}>Dismiss disruption?</span>
        </div>
        <p className="text-xs mb-4 leading-relaxed" style={{ color: "#6b6b78" }}>
          &ldquo;{cardTitle}&rdquo; is an active disruption. Are you sure you want to dismiss it?
        </p>
        <div className="flex gap-2 justify-end">
          <button
            className="h-7 px-3 text-xs font-medium transition-colors cursor-pointer"
            style={{ color: "#6b6b78" }}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="h-7 px-3 text-xs font-medium transition-colors cursor-pointer"
            style={{ color: "#c4444a", border: "1px solid rgba(196,68,74,0.3)" }}
            onClick={onConfirm}
          >
            Dismiss
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}

/* ── Type config ─────────────────────────────────────────── */

const typeConfig: Record<
  ActionCardType,
  { icon: typeof AlertTriangle; accentColor: string; label: string }
> = {
  disruption: {
    icon: AlertTriangle,
    accentColor: "#c4444a",
    label: "Active Disruption",
  },
  risk: {
    icon: Shield,
    accentColor: "#d4a84a",
    label: "Risk Exposure",
  },
  autonomous: {
    icon: Bot,
    accentColor: "#5aab7a",
    label: "Autonomous Action",
  },
};

/* ── Compact card for sidebar ────────────────────────────── */

function ActionCardItemCompact({
  card,
  onClick,
  onDismiss,
}: {
  card: ActionCard;
  onClick: () => void;
  onDismiss: () => void;
}) {
  const conf = typeConfig[card.type];
  const Icon = conf.icon;
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDismissClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (card.type === "disruption") {
      setConfirmOpen(true);
    } else {
      onDismiss();
    }
  };

  return (
    <>
      <div
        onClick={onClick}
        className="group relative cursor-pointer py-3 transition-colors"
        style={{
          borderBottom: "1px solid rgba(228,224,216,0.04)",
          borderLeft: `2px solid ${conf.accentColor}`,
          paddingLeft: "12px",
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <Icon className="h-3 w-3" style={{ color: conf.accentColor }} />
            <span className="text-[10px] font-medium tracking-wide uppercase" style={{ color: conf.accentColor }}>
              {conf.label}
            </span>
          </div>
          <button
            onClick={handleDismissClick}
            className="h-4 w-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            style={{ color: "#6b6b78" }}
            aria-label="Dismiss"
          >
            <X className="h-3 w-3" />
          </button>
        </div>

        {/* Title */}
        <h3 className="text-xs font-medium leading-snug mb-1.5 line-clamp-2" style={{ color: "#e4e0d8" }}>
          {card.title}
        </h3>

        {/* Summary */}
        <p className="text-[10px] leading-relaxed mb-2 line-clamp-2" style={{ color: "#6b6b78" }}>
          {card.summary}
        </p>

        {/* Meta */}
        <div className="flex flex-wrap gap-3 text-[10px]" style={{ color: "#3a3a44" }}>
          <span className="flex items-center gap-1">
            <Clock className="h-2.5 w-2.5" />
            {card.impactTimeframe}
          </span>
          <span className="flex items-center gap-1">
            <DollarSign className="h-2.5 w-2.5" />$
            {(card.affectedValue / 1_000).toFixed(0)}K
          </span>
          <span className="flex items-center gap-1">
            <Package className="h-2.5 w-2.5" />
            {card.affectedSKUs} SKUs
          </span>
        </div>
      </div>

      <DismissConfirmDialog
        open={confirmOpen}
        cardTitle={card.title}
        onConfirm={() => { setConfirmOpen(false); onDismiss(); }}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}

/* ── Detail Modal ────────────────────────────────────────── */

function ActionDetailModal({
  card,
  open,
  onClose,
}: {
  card: ActionCard | null;
  open: boolean;
  onClose: () => void;
}) {
  const [selectedAction, setSelectedAction] = useState<number | null>(null);

  const cardId = card?.id;
  const [prevCardId, setPrevCardId] = useState<string | undefined>(undefined);
  if (cardId !== prevCardId) {
    setPrevCardId(cardId);
    setSelectedAction(null);
  }

  if (!card || !open) return null;
  if (typeof window === "undefined") return null;

  const conf = typeConfig[card.type];
  const Icon = conf.icon;

  const riskColors: Record<string, string> = {
    low: "#5aab7a",
    medium: "#d4a84a",
    high: "#c4444a",
  };

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60]"
        style={{ background: "rgba(0,0,0,0.7)" }}
        onClick={onClose}
      />
      {/* Modal */}
      <div
        className="fixed left-1/2 top-1/2 z-[61] -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-5xl max-h-[85vh] flex flex-col"
        style={{
          background: "#0c0c12",
          border: "1px solid rgba(228,224,216,0.08)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 flex items-start justify-between" style={{ borderBottom: "1px solid rgba(228,224,216,0.06)" }}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Icon className="h-3.5 w-3.5" style={{ color: conf.accentColor }} />
              <span className="text-[10px] font-medium tracking-wider uppercase" style={{ color: conf.accentColor }}>
                {conf.label}
              </span>
              <span className="text-[10px] font-medium tracking-wider uppercase" style={{ color: "#6b6b78" }}>
                · {card.category}
              </span>
            </div>
            <h2 className="text-lg font-light" style={{ color: "#e4e0d8" }}>{card.title}</h2>
          </div>
          <button onClick={onClose} className="cursor-pointer" style={{ color: "#6b6b78" }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Two-column body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* LEFT — Context */}
          <div className="flex-1 min-w-0 overflow-y-auto p-6 space-y-5">
            <section>
              <h4 className="text-[10px] font-semibold tracking-widest uppercase mb-3" style={{ color: "#6b6b78" }}>
                What Happened
              </h4>
              <ul className="space-y-2">
                {card.whatHappened.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm leading-relaxed" style={{ color: "rgba(228,224,216,0.8)" }}>
                    <span className="mt-2 h-px w-3 shrink-0" style={{ background: "#e8c872" }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <div className="h-px" style={{ background: "rgba(228,224,216,0.06)" }} />

            <section>
              <h4 className="text-[10px] font-semibold tracking-widest uppercase mb-3" style={{ color: "#6b6b78" }}>
                How It Affects Your Supply Chain
              </h4>
              <ul className="space-y-2">
                {card.howItAffects.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm leading-relaxed" style={{ color: "rgba(228,224,216,0.8)" }}>
                    <span className="mt-2 h-px w-3 shrink-0" style={{ background: conf.accentColor }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <div className="h-px" style={{ background: "rgba(228,224,216,0.06)" }} />

            {/* Comparison matrix */}
            <section>
              <h4 className="text-[10px] font-semibold tracking-widest uppercase mb-3" style={{ color: "#6b6b78" }}>
                Comparison Matrix
              </h4>
              <div className="overflow-x-auto" style={{ border: "1px solid rgba(228,224,216,0.06)" }}>
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(228,224,216,0.06)" }}>
                      <th className="px-3 py-2 text-left font-medium" style={{ color: "#6b6b78" }}>Action</th>
                      <th className="px-3 py-2 text-left font-medium" style={{ color: "#6b6b78" }}>Cost</th>
                      <th className="px-3 py-2 text-left font-medium" style={{ color: "#6b6b78" }}>Time</th>
                      <th className="px-3 py-2 text-left font-medium" style={{ color: "#6b6b78" }}>Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {card.possibleActions.map((action, i) => (
                      <tr
                        key={i}
                        className="cursor-pointer transition-colors"
                        style={{
                          borderBottom: "1px solid rgba(228,224,216,0.04)",
                          background: selectedAction === i ? "rgba(232,200,114,0.05)" : "transparent",
                        }}
                        onClick={() => setSelectedAction(selectedAction === i ? null : i)}
                      >
                        <td className="px-3 py-2 font-medium" style={{ color: "#e4e0d8" }}>{action.label}</td>
                        <td className="px-3 py-2" style={{ color: "#6b6b78" }}>{action.costImpact}</td>
                        <td className="px-3 py-2" style={{ color: "#6b6b78" }}>{action.timeImpact}</td>
                        <td className="px-3 py-2" style={{ color: riskColors[action.riskLevel] }}>{action.riskLevel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Vertical divider */}
          <div className="w-px shrink-0" style={{ background: "rgba(228,224,216,0.06)" }} />

          {/* RIGHT — Actions */}
          <div className="flex-1 min-w-0 overflow-y-auto p-6 space-y-5">
            <section>
              <h4 className="text-[10px] font-semibold tracking-widest uppercase mb-3" style={{ color: "#6b6b78" }}>
                Possible Actions
              </h4>
              <div className="space-y-1">
                {card.possibleActions.map((action, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedAction(selectedAction === i ? null : i)}
                    className="p-3 transition-colors cursor-pointer"
                    style={{
                      borderLeft: selectedAction === i ? `2px solid ${riskColors[action.riskLevel]}` : "2px solid transparent",
                      background: selectedAction === i ? "rgba(228,224,216,0.02)" : "transparent",
                      borderBottom: "1px solid rgba(228,224,216,0.04)",
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium" style={{ color: "#e4e0d8" }}>
                        {action.label}
                      </span>
                      <span className="text-[10px] font-medium" style={{ color: riskColors[action.riskLevel] }}>
                        {action.riskLevel} risk
                      </span>
                    </div>
                    <p className="text-xs mb-2" style={{ color: "#6b6b78" }}>
                      {action.description}
                    </p>
                    <div className="flex gap-4 text-[11px]" style={{ color: "#3a3a44" }}>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {action.costImpact}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {action.timeImpact}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Steps for selected action */}
            {selectedAction !== null && (
              <section>
                <div className="h-px mb-5" style={{ background: "rgba(228,224,216,0.06)" }} />
                <h4 className="text-[10px] font-semibold tracking-widest uppercase mb-3" style={{ color: "#6b6b78" }}>
                  Steps — {card.possibleActions[selectedAction].label}
                </h4>
                <ol className="space-y-2">
                  {card.possibleActions[selectedAction].steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm leading-relaxed">
                      <span
                        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-[10px] font-mono"
                        style={{ color: "#e8c872", border: "1px solid rgba(232,200,114,0.2)" }}
                      >
                        {i + 1}
                      </span>
                      <span style={{ color: "rgba(228,224,216,0.8)" }}>{step}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: "1px solid rgba(228,224,216,0.06)" }}>
          <button
            className="h-9 px-4 text-sm font-medium cursor-pointer transition-colors"
            style={{ color: "#6b6b78", border: "1px solid rgba(228,224,216,0.08)" }}
          >
            🤖 Discuss
          </button>
          <button
            className="h-9 px-4 text-sm font-medium cursor-pointer transition-colors"
            style={{
              background: selectedAction !== null ? "#e8c872" : "rgba(228,224,216,0.05)",
              color: selectedAction !== null ? "#0c0c12" : "#3a3a44",
            }}
            disabled={selectedAction === null}
          >
            Confirm
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}

/* ── Sidebar container ───────────────────────────────────── */

export function ActionCardsSidebar() {
  const [selectedCard, setSelectedCard] = useState<ActionCard | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = actionCards.filter((c) => !dismissed.has(c.id));

  const dismiss = (id: string) =>
    setDismissed((prev) => new Set([...prev, id]));

  return (
    <>
      <div
        className="flex h-full flex-col overflow-hidden min-h-0"
        style={{ borderRight: "1px solid rgba(228,224,216,0.06)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(228,224,216,0.06)" }}>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full" style={{ background: "#d4a84a" }} />
            <h2 className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#e4e0d8" }}>
              Action Required
            </h2>
          </div>
          <span className="text-[10px]" style={{ color: "#3a3a44" }}>
            {visible.length} items
          </span>
        </div>

        {/* Card feed */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-1 min-h-0">
          {visible.map((card) => (
            <ActionCardItemCompact
              key={card.id}
              card={card}
              onClick={() => setSelectedCard(card)}
              onDismiss={() => dismiss(card.id)}
            />
          ))}
          {visible.length === 0 && (
            <p className="py-8 text-center text-xs" style={{ color: "#6b6b78" }}>
              All items addressed.
            </p>
          )}
        </div>
      </div>

      <ActionDetailModal
        card={selectedCard}
        open={selectedCard !== null}
        onClose={() => setSelectedCard(null)}
      />
    </>
  );
}

/* ── Carousel variant (unused currently, kept for API parity) */

export function ActionCardsCarousel() {
  return <ActionCardsSidebar />;
}
