"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Clock,
  DollarSign,
  ArrowLeft,
  Bot,
  User,
  Loader2,
  CheckCircle2,
  Circle,
  X,
  Mic,
  Paperclip,
  SendHorizonal,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { actionCards } from "@/lib/mock-data";
import { typeConfig } from "@/components/action-cards";

/* ── Chat message type ─────────────────────────────────── */
type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

const initialMessages: ChatMessage[] = [
  {
    id: "msg-0",
    role: "assistant",
    content:
      "I'm your supply chain AI co-pilot. I can help you brainstorm alternative strategies, request changes to the current plan, explore \"what-if\" scenarios, or compare trade-offs. What would you like to work on?",
    timestamp: new Date(),
  },
];

/* ── Confirm Execution Modal (placeholder) ─────────────── */
function ConfirmExecutionModal({
  open,
  onClose,
  actionLabel,
  steps,
}: {
  open: boolean;
  onClose: () => void;
  actionLabel: string;
  steps: string[];
}) {
  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed left-1/2 top-1/2 z-[61] -translate-x-1/2 -translate-y-1/2 w-[520px] max-h-[80vh] rounded-xl glass-strong border border-border/50 shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 shrink-0">
              <div>
                <h3 className="text-sm font-semibold">Execute Action Plan</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {actionLabel}
                </p>
              </div>
              <button
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Steps */}
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-3">
                {steps.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border/40 bg-card/40"
                  >
                    <div className="mt-0.5 shrink-0">
                      <Circle className="h-5 w-5 text-muted-foreground/50" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground/90 leading-relaxed">
                        {step}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Pending
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border/50 shrink-0">
              <p className="text-[11px] text-muted-foreground">
                Execution engine coming soon
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button size="sm" className="text-xs gap-1.5" disabled>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Execute All
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ── Chatbot UI ────────────────────────────────────────── */
function ChatPanel({
  cardTitle,
  highlighted,
}: {
  cardTitle: string;
  highlighted: boolean;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Focus input when highlighted
  useEffect(() => {
    if (highlighted && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 600);
    }
  }, [highlighted]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response after delay
    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: getPlaceholderResponse(userMsg.content, cardTitle),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200 + Math.random() * 800);
  };

  return (
    <div
      className="flex flex-col rounded-xl border border-border/50 bg-card/40 overflow-hidden"
      style={{ height: "420px" }}
    >
      {/* Chat header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 shrink-0">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div>
          <span className="text-sm font-medium">AI Brainstorm</span>
          <p className="text-[10px] text-muted-foreground">
            Brainstorm plans, request changes, or explore alternatives
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0"
      >
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex gap-2.5 ${
              msg.role === "user" ? "flex-row-reverse" : ""
            }`}
          >
            <div
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                msg.role === "assistant"
                  ? "bg-primary/15 text-primary"
                  : "bg-accent text-foreground"
              }`}
            >
              {msg.role === "assistant" ? (
                <Bot className="h-3.5 w-3.5" />
              ) : (
                <User className="h-3.5 w-3.5" />
              )}
            </div>
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                msg.role === "assistant"
                  ? "bg-muted/40 text-foreground/90"
                  : "bg-primary/15 text-foreground"
              }`}
            >
              {msg.content}
            </div>
          </motion.div>
        ))}

        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-2.5"
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-muted/40 px-3 py-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Thinking…</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input bar — matching command bar style */}
      <div className="border-t border-border/50 p-3 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-1 bg-muted/30 border border-border/50 rounded-lg px-3 py-1.5"
        >
          <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Brainstorm ideas, request plan changes, explore alternatives…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none mx-2 min-w-0"
          />
          <div className="flex items-center gap-1 border-l border-border/50 pl-2 shrink-0">
            <button
              type="button"
              className="p-1 rounded hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
              <Mic className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="p-1 rounded hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
              <Paperclip className="h-3.5 w-3.5" />
            </button>
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="p-1 rounded hover:bg-primary/20 text-primary transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <SendHorizonal className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/** Placeholder responses — emphasizing brainstorming and plan iteration */
function getPlaceholderResponse(userInput: string, cardTitle: string): string {
  const lower = userInput.toLowerCase();

  // Detect change requests
  if (
    lower.includes("change") ||
    lower.includes("modify") ||
    lower.includes("update") ||
    lower.includes("adjust") ||
    lower.includes("instead") ||
    lower.includes("switch") ||
    lower.includes("replace")
  ) {
    return `Great idea! I've drafted a modified plan based on your suggestion. Once you're happy with the changes, press the **Brainstorm** button below to regenerate the action options, or **Confirm** to lock in the current selection and start execution.`;
  }

  // Detect new plan / alternative requests
  if (
    lower.includes("new plan") ||
    lower.includes("alternative") ||
    lower.includes("different approach") ||
    lower.includes("other option") ||
    lower.includes("what if") ||
    lower.includes("another way") ||
    lower.includes("brainstorm")
  ) {
    return `Here are some alternative strategies we could consider for "${cardTitle}":\n\n1. **Split the order** across two suppliers to reduce dependency risk.\n2. **Negotiate expedited terms** with the current supplier for partial early delivery.\n3. **Source from spot market** for the most critical SKUs while waiting.\n\nWant me to flesh out any of these? When you're ready to apply changes, press the **Brainstorm** button to regenerate the action options with these ideas incorporated.`;
  }

  if (lower.includes("cost") || lower.includes("price") || lower.includes("expensive") || lower.includes("budget")) {
    return `Based on the analysis for "${cardTitle}", the cost impact varies by option. The lowest-cost option may carry higher risk, while premium options offer faster resolution. I can help you brainstorm cost-saving variations — for example, partial shipments or phased execution. Want me to explore those? Once you settle on a direction, press **Brainstorm** to update the plan.`;
  }

  if (lower.includes("risk") || lower.includes("danger") || lower.includes("safe")) {
    return `Risk assessment considers multiple factors: supplier reliability, transit time uncertainty, and market volatility. I can brainstorm risk-mitigation overlays — like splitting orders or adding contingency triggers. Want me to draft a lower-risk variant? Press **Brainstorm** when ready to regenerate options.`;
  }

  if (lower.includes("time") || lower.includes("fast") || lower.includes("delay") || lower.includes("quick") || lower.includes("urgent")) {
    return `Timeline depends on the chosen strategy. I can brainstorm ways to compress timelines — parallel processing, pre-positioning inventory, or expedite fees. Want me to draft a faster variant? Once finalized, press **Brainstorm** to update the action plan.`;
  }

  if (lower.includes("recommend") || lower.includes("suggest") || lower.includes("best") || lower.includes("which")) {
    return `Based on current trade-offs, I'd recommend the medium-risk option as the best balance of cost and speed. But your priorities matter — I can brainstorm custom variants optimized for what matters most to you (speed, cost, safety). Tell me your constraints and I'll draft options. Press **Brainstorm** to regenerate when ready.`;
  }

  return `That's a great angle on "${cardTitle}". I can help by:\n• **Brainstorming** new strategies or variations\n• **Modifying** the current plan (e.g. swap suppliers, change timing)\n• **Exploring trade-offs** between different approaches\n\nJust tell me what you'd like to change or explore, and when you're ready to apply changes, press the **Brainstorm** button to regenerate the options.`;
}

/* ── Main Page Content (needs searchParams) ────────────── */
function ActionDetailContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatRef = useRef<HTMLDivElement>(null);

  const focusParam = searchParams.get("focus");
  const actionParam = searchParams.get("action");

  const card = actionCards.find((c) => c.id === id);

  // Derive initial values from URL params instead of setting state in effects
  const initialAction = (() => {
    if (focusParam === "confirm" && actionParam !== null && card) {
      const idx = parseInt(actionParam, 10);
      if (!isNaN(idx) && idx >= 0 && idx < card.possibleActions.length) return idx;
    }
    return null;
  })();

  const [selectedAction, setSelectedAction] = useState<number | null>(initialAction);
  const [confirmModalOpen, setConfirmModalOpen] = useState(focusParam === "confirm" && initialAction !== null);

  // Handle focus=chat → scroll to chat
  useEffect(() => {
    if (!card) return;
    if (focusParam === "chat" && chatRef.current) {
      setTimeout(() => {
        chatRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  }, [focusParam, card]);

  // Handle focus=confirm → open modal after short delay
  useEffect(() => {
    if (focusParam === "confirm" && initialAction !== null && !confirmModalOpen) {
      setTimeout(() => setConfirmModalOpen(true), 400);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!card) {
    return (
      <div className="flex h-[80vh] items-center justify-center flex-col gap-4">
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
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
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

      {/* Two-column body */}
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
                        className={`border-b border-border/30 last:border-0 cursor-pointer transition-colors ${
                          selectedAction === i
                            ? "bg-primary/10"
                            : "hover:bg-muted/20"
                        }`}
                        onClick={() =>
                          setSelectedAction(selectedAction === i ? null : i)
                        }
                      >
                        <td className="px-4 py-3 font-medium">{action.label}</td>
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

        {/* RIGHT COLUMN — Actions + Chat */}
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
                      className={`rounded-lg border p-4 transition-all cursor-pointer ${
                        selectedAction === i
                          ? `${riskBg[action.riskLevel]} ring-1 ring-inset ring-current/10`
                          : "border-border/50 bg-card/60 hover:bg-accent/30"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium">{action.label}</span>
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
                            <span className="text-foreground/90 pt-0.5">{step}</span>
                          </motion.li>
                        )
                      )}
                    </ol>
                  </motion.section>
                )}
              </AnimatePresence>

              <Separator className="bg-border/50" />

              {/* Chatbot UI — Brainstorm */}
              <section ref={chatRef}>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  ✨ AI Brainstorm
                </h4>
                <ChatPanel
                  cardTitle={card.title}
                  highlighted={focusParam === "chat"}
                />
              </section>
            </div>
          </ScrollArea>

          {/* Sticky footer — Brainstorm & Confirm */}
          <div className="flex items-center justify-end gap-3 px-8 py-4 border-t border-border/50 shrink-0">
            <Button
              variant="outline"
              className="gap-2 text-sm"
              onClick={() => {
                chatRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
              }}
            >
              <span className="text-base leading-none">🤖</span>
              Brainstorm
            </Button>
            <Button
              className="gap-2 text-sm"
              disabled={selectedAction === null}
              onClick={() => setConfirmModalOpen(true)}
            >
              Confirm
            </Button>
          </div>
        </div>
      </div>

      {/* Confirm Execution Modal */}
      <ConfirmExecutionModal
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        actionLabel={
          selectedAction !== null
            ? card.possibleActions[selectedAction].label
            : ""
        }
        steps={
          selectedAction !== null
            ? card.possibleActions[selectedAction].steps
            : []
        }
      />
    </div>
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
