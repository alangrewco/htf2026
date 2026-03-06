"use client";

import { useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Clock,
  DollarSign,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  mockActionCards,
  useActionCards,
} from "@/lib/api/ui/action-cards";
import { typeConfig } from "@/components/action-cards";
import { BrainstormChatDrawer } from "@/components/brainstorm-chat-modal";
import { ExecutePlanModal } from "@/components/execute-plan-modal";
import { NavbarSpacer, NAVBAR_HEIGHT_REM } from "@/components/navbar";

/* ── Main Page Content (needs searchParams) ────────────── */
function ActionDetailContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: actionCards = mockActionCards, isLoading } = useActionCards();

  const focusParam = searchParams.get("focus");
  const actionParam = searchParams.get("action");

  const card = actionCards.find((c) => c.id === id);

  // Derive initial values from URL params
  const initialAction = (() => {
    if (focusParam === "confirm" && actionParam !== null && card) {
      const idx = parseInt(actionParam, 10);
      if (!isNaN(idx) && idx >= 0 && idx < card.possibleActions.length)
        return idx;
    }
    return null;
  })();

  const [selectedAction, setSelectedAction] = useState<number | null>(
    initialAction
  );
  const [brainstormOpen, setBrainstormOpen] = useState(focusParam === "chat");
  const [executeOpen, setExecuteOpen] = useState(
    focusParam === "confirm" && initialAction !== null
  );

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center flex-col gap-3">
        <NavbarSpacer />
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground text-sm">Loading action details…</p>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="flex h-[80vh] items-center justify-center flex-col gap-4">
        <NavbarSpacer />
        <AlertTriangle className="h-10 w-10 text-urgency-critical" />
        <p className="text-muted-foreground text-sm">Action card not found.</p>
        <Button variant="outline" onClick={() => router.back()}>
          Go back
        </Button>
      </div>
    );
  }

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
    <>
      <NavbarSpacer />
      <div className="flex flex-col" style={{ height: `calc(100vh - ${NAVBAR_HEIGHT_REM})` }}>
        {/* Page header */}
        <div className="glass border-b border-border/50 px-6 py-4 shrink-0">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
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
            <h1 className="text-xl font-semibold">{card.title}</h1>
          </div>
        </div>

        {/* Body — main content + brainstorm drawer side-by-side */}
        <div className="flex flex-1 min-h-0">
          {/* Main content area (pushes left when drawer opens) */}
          <motion.div
            className="flex flex-1 min-h-0 min-w-0"
            layout
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            <div className="flex flex-1 min-h-0 max-w-7xl mx-auto w-full">
              {/* LEFT COLUMN — Context */}
              <ScrollArea className="flex-1 min-w-0">
                <div className="p-8 space-y-6">
                  {/* What happened */}
                  <section>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      What Happened
                    </h4>
                    <ul className="space-y-2">
                      {card.whatHappened.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2.5 text-sm leading-relaxed"
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
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      How It Affects Your Supply Chain
                    </h4>
                    <ul className="space-y-2">
                      {card.howItAffects.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2.5 text-sm leading-relaxed"
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
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Comparison Matrix
                    </h4>
                    <div className="overflow-x-auto rounded-lg border border-border/50">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border/50 bg-muted/30">
                            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                              Action
                            </th>
                            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                              Cost
                            </th>
                            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                              Time
                            </th>
                            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
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
                              <td className="px-4 py-3 font-medium">
                                {action.label}
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {action.costImpact}
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {action.timeImpact}
                              </td>
                              <td className="px-4 py-3">
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
              <div className="flex-1 min-w-0 flex flex-col min-h-0">
                <ScrollArea className="flex-1">
                  <div className="p-8 space-y-6">
                    {/* Possible actions */}
                    <section>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Possible Actions
                      </h4>
                      <div className="space-y-3">
                        {card.possibleActions.map((action, i) => (
                          <div
                            key={i}
                            onClick={() =>
                              setSelectedAction(selectedAction === i ? null : i)
                            }
                            className={`rounded-lg border p-4 transition-all cursor-pointer ${selectedAction === i
                                ? `${riskBg[action.riskLevel]} ring-1 ring-inset ring-current/10`
                                : "border-border/50 bg-card/60 hover:bg-accent/30"
                              }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
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
                            <p className="text-xs text-muted-foreground mb-2.5">
                              {action.description}
                            </p>
                            <div className="flex gap-5 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3.5 w-3.5" />
                                {action.costImpact}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
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
                          <Separator className="bg-border/50 mb-6" />
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                            Steps — {card.possibleActions[selectedAction].label}
                          </h4>
                          <ol className="space-y-3">
                            {card.possibleActions[selectedAction].steps.map(
                              (step, i) => (
                                <motion.li
                                  key={i}
                                  initial={{ opacity: 0, x: -8 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.05 }}
                                  className="flex items-start gap-3 text-sm leading-relaxed"
                                >
                                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                                    {i + 1}
                                  </span>
                                  <span className="text-foreground/90 pt-0.5">
                                    {step}
                                  </span>
                                </motion.li>
                              )
                            )}
                          </ol>
                        </motion.section>
                      )}
                    </AnimatePresence>
                  </div>
                </ScrollArea>

                {/* Sticky footer — Brainstorm & Confirm */}
                <div className="flex items-center justify-end gap-3 px-8 py-4 border-t border-border/50 shrink-0">
                  <Button
                    variant={brainstormOpen ? "default" : "outline"}
                    className="gap-2 text-sm"
                    onClick={() => setBrainstormOpen(!brainstormOpen)}
                  >
                    <span className="text-base leading-none">🤖</span>
                    {brainstormOpen ? "Close Chat" : "Brainstorm"}
                  </Button>
                  <Button
                    className="gap-2 text-sm"
                    disabled={selectedAction === null}
                    onClick={() => setExecuteOpen(true)}
                  >
                    Confirm
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Brainstorm Chat Drawer (right side, inline) */}
          <BrainstormChatDrawer
            open={brainstormOpen}
            onClose={() => setBrainstormOpen(false)}
            cardTitle={card.title}
          />
        </div>

        {/* Execute Plan Modal */}
        <ExecutePlanModal
          open={executeOpen}
          onClose={() => setExecuteOpen(false)}
          actionLabel={
            selectedAction !== null
              ? card.possibleActions[selectedAction].label
              : ""
          }
          executionSteps={
            selectedAction !== null
              ? card.possibleActions[selectedAction].executionSteps
              : []
          }
        />
      </div>
    </>
  );
}

/* ── Page wrapper with Suspense for useSearchParams ────── */
export default function ActionDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[80vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ActionDetailContent />
    </Suspense>
  );
}
