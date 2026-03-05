"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Shield,
  Bot,
  Clock,
  DollarSign,
  Package,
  Check,
  Eye,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { ActionCard, ActionCardType } from "@/lib/mock-data";
import { actionCards } from "@/lib/mock-data";

const typeConfig: Record<
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="group relative w-[340px] shrink-0 rounded-xl border border-border bg-card overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
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

        {/* Quick actions */}
        <div className="mt-3 flex gap-2">
          {card.type === "autonomous" ? (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[11px] text-urgency-safe border-urgency-safe/30 hover:bg-urgency-safe/10"
              onClick={onClick}
            >
              <Check className="mr-1 h-3 w-3" />
              Acknowledge
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[11px] text-primary border-primary/30 hover:bg-primary/10"
                onClick={onClick}
              >
                <Eye className="mr-1 h-3 w-3" />
                Review
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-[11px] text-muted-foreground hover:text-foreground"
                onClick={onDismiss}
              >
                <X className="mr-1 h-3 w-3" />
                Dismiss
              </Button>
            </>
          )}
        </div>
      </div>
    </motion.div>
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
  if (!card) return null;
  const conf = typeConfig[card.type];
  const Icon = conf.icon;

  const riskColors = {
    low: "text-urgency-safe",
    medium: "text-urgency-warning",
    high: "text-urgency-critical",
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-2xl glass-strong border-border/50 max-h-[85vh]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
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
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-5">
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

            {/* Possible actions */}
            <section>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Possible Actions
              </h4>
              <div className="space-y-2">
                {card.possibleActions.map((action, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-border/50 bg-card/60 p-3 transition-colors hover:bg-accent/30 cursor-pointer"
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

            <Separator className="bg-border/50" />

            {/* Pros/Cons matrix */}
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
                        className="border-b border-border/30 last:border-0"
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

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      className="group relative rounded-lg border border-border/50 bg-card/50 overflow-hidden transition-all duration-300 hover:bg-accent/50 hover:border-border"
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
        <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground mb-2">
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

        {/* Quick actions */}
        <div className="flex gap-2">
          {card.type === "autonomous" ? (
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-[10px] text-urgency-safe border-urgency-safe/30 hover:bg-urgency-safe/10"
              onClick={onClick}
            >
              <Check className="mr-1 h-2.5 w-2.5" />
              Acknowledge
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-[10px] text-primary border-primary/30 hover:bg-primary/10"
                onClick={onClick}
              >
                <Eye className="mr-1 h-2.5 w-2.5" />
                Review
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-[10px] text-muted-foreground hover:text-foreground"
                onClick={onDismiss}
              >
                <X className="mr-1 h-2.5 w-2.5" />
                Dismiss
              </Button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function ActionCardsSidebar() {
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
