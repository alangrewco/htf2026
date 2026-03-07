"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Shield,
  Bot,
  Clock,
  DollarSign,
  Package,
  X,
  Maximize2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  mockActionCards,
  type ActionCard,
  type ActionCardType,
  useActionCards,
} from "@/lib/api/ui/action-cards";

/** Tiny confirm dialog shown only when dismissing an Active Disruption card */
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
  if (typeof window === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
          />
          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed left-1/2 top-1/2 z-[71] -translate-x-1/2 -translate-y-1/2 w-[340px] rounded-xl glass-strong border border-border/50 shadow-xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-urgency-critical shrink-0" />
              <span className="text-sm font-semibold">Dismiss disruption?</span>
            </div>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              &ldquo;{cardTitle}&rdquo; is an active disruption. Are you sure you want to dismiss it?
            </p>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs text-urgency-critical border-urgency-critical/30 hover:bg-urgency-critical/10"
                onClick={onConfirm}
              >
                Dismiss
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

export const typeConfig: Record<
  ActionCardType,
  { icon: typeof AlertTriangle; gradient: string; badge: string; label: string }
> = {
  disruption: {
    icon: AlertTriangle,
    gradient: "from-red-500/20 via-orange-500/10 to-transparent",
    badge: "bg-urgency-critical/20 text-urgency-critical border-urgency-critical/30",
    label: "Active Disruption",
  },
  risk: {
    icon: Shield,
    gradient: "from-amber-500/20 via-yellow-500/10 to-transparent",
    badge: "bg-urgency-warning/20 text-urgency-warning border-urgency-warning/30",
    label: "Risk Exposure",
  },
  autonomous: {
    icon: Bot,
    gradient: "from-emerald-500/20 via-teal-500/10 to-transparent",
    badge: "bg-urgency-safe/20 text-urgency-safe border-urgency-safe/30",
    label: "Autonomous Action",
  },
};

function ActionCardItem({
  card,
  index,
  onClick,
  onDismiss,
}: {
  card: ActionCard;
  index: number;
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
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: index * 0.08, duration: 0.4 }}
        onClick={onClick}
        className="group relative w-[340px] shrink-0 cursor-pointer rounded-xl border border-border bg-card overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
      >
        {/* Gradient accent */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${conf.gradient} pointer-events-none`}
        />

        <div className="relative p-4 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <Badge
              variant="outline"
              className={`${conf.badge} text-[10px] font-medium`}
            >
              <Icon className="mr-1 h-3 w-3" />
              {conf.label}
            </Badge>
            <button
              onClick={handleDismissClick}
              className="h-5 w-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground hover:bg-accent/50"
              aria-label="Dismiss"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold leading-snug mb-2">
            {card.title}
          </h3>

          {/* Summary */}
          <p className="text-xs text-muted-foreground leading-relaxed mb-4 line-clamp-2">
            {card.summary}
          </p>

          {/* Meta */}
          <div className="mt-auto flex flex-wrap gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {card.impactTimeframe}
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />$
              {(card.affectedValue / 1_000).toFixed(0)}K
            </span>
            <span className="flex items-center gap-1">
              <Package className="h-3 w-3" />
              {card.affectedSKUs} SKUs
            </span>
          </div>
        </div>
      </motion.div>

      <DismissConfirmDialog
        open={confirmOpen}
        cardTitle={card.title}
        onConfirm={() => { setConfirmOpen(false); onDismiss(); }}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}

function ActionDetailModal({
  card,
  open,
  onClose,
}: {
  card: ActionCard | null;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [selectedAction, setSelectedAction] = useState<number | null>(null);

  // Reset selected action when card changes
  const cardId = card?.id;
  const [prevCardId, setPrevCardId] = useState<string | undefined>(undefined);
  if (cardId !== prevCardId) {
    setPrevCardId(cardId);
    setSelectedAction(null);
  }

  if (!card) return null;
  const conf = typeConfig[card.type];
  const Icon = conf.icon;

  const riskColors = {
    low: "text-urgency-safe",
    medium: "text-urgency-warning",
    high: "text-urgency-critical",
  };

  const riskBg = {
    low: "border-urgency-safe/40 bg-urgency-safe/5",
    medium: "border-urgency-warning/40 bg-urgency-warning/5",
    high: "border-urgency-critical/40 bg-urgency-critical/5",
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-5xl glass-strong border-border/50 max-h-[85vh] p-0 gap-0" showCloseButton={false}>
        {/* Header — badges left, close+expand buttons right */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-border/50 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge
                variant="outline"
                className={`${conf.badge} text-[10px] font-medium`}
              >
                <Icon className="mr-1 h-3 w-3" />
                {conf.label}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {card.category}
              </Badge>
            </div>
            <DialogTitle className="text-lg">{card.title}</DialogTitle>
          </div>

          {/* Button group: expand then close */}
          <div className="flex items-center gap-1 shrink-0 ml-4">
            <button
              onClick={() => {
                onClose();
                router.push(`/dashboard/actions/${card.id}`);
              }}
              aria-label="Open full page"
              className="flex h-7 w-7 items-center justify-center rounded-md opacity-70 text-foreground hover:opacity-100 hover:bg-accent/50 transition-opacity"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex h-7 w-7 items-center justify-center rounded-md opacity-70 text-foreground hover:opacity-100 hover:bg-accent/50 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Two-column body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* LEFT COLUMN — Context */}
          <ScrollArea className="flex-1 min-w-0">
            <div className="p-6 space-y-5">
              {/* What happened */}
              <section>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  What Happened
                </h4>
                <ul className="space-y-1.5">
                  {card.whatHappened.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm leading-relaxed"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground shrink-0" />
                      <span className="text-foreground/90">{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <Separator className="bg-border/50" />

              {/* How it affects */}
              <section>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  How It Affects Your Supply Chain
                </h4>
                <ul className="space-y-1.5">
                  {card.howItAffects.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm leading-relaxed"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span className="text-foreground/90">{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <Separator className="bg-border/50" />

              {/* Comparison matrix */}
              <section>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Comparison Matrix
                </h4>
                <div className="overflow-x-auto rounded-lg border border-border/50">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/30">
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                          Action
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                          Cost
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                          Time
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                          Risk
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {card.possibleActions.map((action, i) => (
                        <tr
                          key={i}
                          className={`border-b border-border/30 last:border-0 cursor-pointer transition-colors ${selectedAction === i
                            ? "bg-primary/10"
                            : "hover:bg-muted/20"
                            }`}
                          onClick={() =>
                            setSelectedAction(selectedAction === i ? null : i)
                          }
                        >
                          <td className="px-3 py-2 font-medium">
                            {action.label}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {action.costImpact}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {action.timeImpact}
                          </td>
                          <td className="px-3 py-2">
                            <span className={riskColors[action.riskLevel]}>
                              {action.riskLevel}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </ScrollArea>

          {/* VERTICAL DIVIDER */}
          <div className="w-px bg-border/50 shrink-0" />

          {/* RIGHT COLUMN — Actions */}
          <ScrollArea className="flex-1 min-w-0">
            <div className="p-6 space-y-5">
              {/* Possible actions */}
              <section>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Possible Actions
                </h4>
                <div className="space-y-2">
                  {card.possibleActions.map((action, i) => (
                    <div
                      key={i}
                      onClick={() =>
                        setSelectedAction(selectedAction === i ? null : i)
                      }
                      className={`rounded-lg border p-3 transition-all cursor-pointer ${selectedAction === i
                        ? `${riskBg[action.riskLevel]} ring-1 ring-inset ring-current/10`
                        : "border-border/50 bg-card/60 hover:bg-accent/30"
                        }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">
                          {action.label}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${riskColors[action.riskLevel]}`}
                        >
                          {action.riskLevel} risk
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {action.description}
                      </p>
                      <div className="flex gap-4 text-[11px] text-muted-foreground">
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
              <AnimatePresence mode="wait">
                {selectedAction !== null && (
                  <motion.section
                    key={selectedAction}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Separator className="bg-border/50 mb-5" />
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Steps — {card.possibleActions[selectedAction].label}
                    </h4>
                    <ol className="space-y-2">
                      {card.possibleActions[selectedAction].steps.map(
                        (step, i) => (
                          <motion.li
                            key={i}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex items-start gap-2.5 text-sm leading-relaxed"
                          >
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
                              {i + 1}
                            </span>
                            <span className="text-foreground/90">{step}</span>
                          </motion.li>
                        )
                      )}
                    </ol>
                  </motion.section>
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </div>

        {/* Footer — Brainstorm & Confirm */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/50">
          <Button
            variant="outline"
            className="gap-2 text-sm"
            onClick={() => {
              onClose();
              router.push(`/dashboard/actions/${card.id}?focus=chat`);
            }}
          >
            <span className="text-base leading-none">🤖</span>
            Brainstorm
          </Button>
          <Button
            className="gap-2 text-sm"
            disabled={selectedAction === null}
            onClick={() => {
              onClose();
              router.push(`/dashboard/actions/${card.id}?focus=confirm&action=${selectedAction}`);
            }}
          >
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* Vertical sidebar panel for Action Required cards */
function ActionCardItemCompact({
  card,
  index,
  onClick,
  onDismiss,
}: {
  card: ActionCard;
  index: number;
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
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.06, duration: 0.35 }}
        onClick={onClick}
        className="group relative cursor-pointer rounded-lg border border-border/50 bg-card/50 overflow-hidden transition-all duration-300 hover:bg-accent/50 hover:border-border"
      >
        {/* Gradient accent */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${conf.gradient} pointer-events-none`}
        />

        <div className="relative p-3 flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <Badge
              variant="outline"
              className={`${conf.badge} text-[10px] font-medium`}
            >
              <Icon className="mr-1 h-3 w-3" />
              {conf.label}
            </Badge>
            <button
              onClick={handleDismissClick}
              className="h-4 w-4 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground hover:bg-accent/50"
              aria-label="Dismiss"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          {/* Title */}
          <h3 className="text-xs font-semibold leading-snug mb-1.5 line-clamp-2">
            {card.title}
          </h3>

          {/* Summary */}
          <p className="text-[10px] text-muted-foreground leading-relaxed mb-3 line-clamp-2">
            {card.summary}
          </p>

          {/* Meta */}
          <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
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
      </motion.div>

      <DismissConfirmDialog
        open={confirmOpen}
        cardTitle={card.title}
        onConfirm={() => { setConfirmOpen(false); onDismiss(); }}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}

export function ActionCardsSidebar() {
  const { data: actionCards = mockActionCards } = useActionCards();
  const [selectedCard, setSelectedCard] = useState<ActionCard | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = actionCards.filter((c) => !dismissed.has(c.id));

  const dismiss = (id: string) =>
    setDismissed((prev) => new Set([...prev, id]));

  return (
    <>
      <div className="glass flex h-full flex-col rounded-xl overflow-hidden min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-urgency-warning animate-pulse" />
            <h2 className="text-sm font-semibold">Action Required</h2>
          </div>
          <span className="text-[10px] text-muted-foreground">
            {visible.length} items
          </span>
        </div>

        {/* Scrollable card feed */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-3 min-h-0">
          <div className="space-y-2">
            {visible.map((card, index) => (
              <ActionCardItemCompact
                key={card.id}
                card={card}
                index={index}
                onClick={() => setSelectedCard(card)}
                onDismiss={() => dismiss(card.id)}
              />
            ))}
            {visible.length === 0 && (
              <p className="py-8 text-center text-xs text-muted-foreground">
                All items addressed.
              </p>
            )}
          </div>
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

export function ActionCardsCarousel() {
  const { data: actionCards = mockActionCards } = useActionCards();
  const [selectedCard, setSelectedCard] = useState<ActionCard | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = actionCards.filter((c) => !dismissed.has(c.id));

  const dismiss = (id: string) =>
    setDismissed((prev) => new Set([...prev, id]));

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Action Required
          </h2>
          <span className="text-xs text-muted-foreground">
            {visible.length} items · Sorted by urgency
          </span>
        </div>

        {/* Horizontal scroll carousel */}
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scroll-smooth">
          {visible.map((card, index) => (
            <ActionCardItem
              key={card.id}
              card={card}
              index={index}
              onClick={() => setSelectedCard(card)}
              onDismiss={() => dismiss(card.id)}
            />
          ))}
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
