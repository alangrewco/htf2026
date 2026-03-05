"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Bot,
  User,
  Loader2,
  Mic,
  Paperclip,
  SendHorizonal,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ── Types ─────────────────────────────────────────────── */
type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  /** If true a "Confirm Research Plan" button appears after this message */
  showConfirm?: boolean;
};

/* ── Placeholder response generator ────────────────────── */
function getPlaceholderResponse(
  userInput: string,
  cardTitle: string,
  msgCount: number
): { content: string; showConfirm: boolean } {
  const lower = userInput.toLowerCase();

  // After 3+ exchanges, propose a research plan
  if (msgCount >= 3) {
    return {
      content: `Great discussion! Based on everything we've explored for "${cardTitle}", here's my **proposed research plan**:\n\n1. **Identify alternative suppliers** in low-risk regions matching current specs\n2. **Run cost-benefit analysis** comparing rerouting vs. backup procurement\n3. **Model timeline scenarios** for each option (best / expected / worst case)\n4. **Draft stakeholder summary** with recommended action\n\nIf this looks good, press **Confirm** below and I'll update the action plan with these findings.`,
      showConfirm: true,
    };
  }

  if (
    lower.includes("change") ||
    lower.includes("modify") ||
    lower.includes("instead") ||
    lower.includes("switch")
  ) {
    return {
      content: `Good call — I can adjust the plan for "${cardTitle}". Want me to explore different suppliers, a different timeline, or an entirely different approach? Tell me more and I'll draft revised options.`,
      showConfirm: false,
    };
  }

  if (
    lower.includes("alternative") ||
    lower.includes("what if") ||
    lower.includes("brainstorm") ||
    lower.includes("other option")
  ) {
    return {
      content: `Here are some alternative strategies for "${cardTitle}":\n\n1. **Split the order** across two suppliers to reduce dependency risk\n2. **Negotiate expedited terms** with the current supplier for partial early delivery\n3. **Source from spot market** for the most critical SKUs\n\nWant me to dig deeper into any of these? I can model the cost and timeline for each.`,
      showConfirm: false,
    };
  }

  if (lower.includes("cost") || lower.includes("budget") || lower.includes("price")) {
    return {
      content: `For "${cardTitle}", the cost drivers are freight premiums, supplier pricing tier, and urgency fees. I can brainstorm cost-saving angles — like partial shipments, or negotiating volume discounts with the backup supplier. Want me to explore those?`,
      showConfirm: false,
    };
  }

  if (lower.includes("risk") || lower.includes("safe")) {
    return {
      content: `Risk factors for "${cardTitle}" include supplier reliability, transit uncertainty, and market volatility. I can brainstorm mitigation overlays — splitting orders, adding contingency triggers, or hedging with futures. Which angle interests you?`,
      showConfirm: false,
    };
  }

  return {
    content: `That's a great angle on "${cardTitle}". I can help by:\n• **Brainstorming** new strategies or variations\n• **Modifying** the current plan (swap suppliers, adjust timing)\n• **Exploring trade-offs** between different approaches\n\nJust let me know what you'd like to dig into!`,
    showConfirm: false,
  };
}

/* ── Component ─────────────────────────────────────────── */
export function BrainstormChatModal({
  open,
  onClose,
  cardTitle,
}: {
  open: boolean;
  onClose: () => void;
  cardTitle: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "bs-0",
      role: "assistant",
      content: `Let's brainstorm strategies for **"${cardTitle}"**. I can help you explore alternatives, model "what-if" scenarios, compare trade-offs, or propose entirely new approaches.\n\nWhat would you like to explore first?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const userMsgCount = useRef(0);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Focus on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setMessages([
        {
          id: "bs-0",
          role: "assistant",
          content: `Let's brainstorm strategies for **"${cardTitle}"**. I can help you explore alternatives, model "what-if" scenarios, compare trade-offs, or propose entirely new approaches.\n\nWhat would you like to explore first?`,
          timestamp: new Date(),
        },
      ]);
      setInput("");
      setIsTyping(false);
      userMsgCount.current = 0;
    }
  }, [open, cardTitle]);

  const handleSend = useCallback(() => {
    if (!input.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: `bs-u-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };
    userMsgCount.current++;
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const resp = getPlaceholderResponse(
        userMsg.content,
        cardTitle,
        userMsgCount.current
      );
      const aiMsg: ChatMessage = {
        id: `bs-a-${Date.now()}`,
        role: "assistant",
        content: resp.content,
        timestamp: new Date(),
        showConfirm: resp.showConfirm,
      };
      setMessages((p) => [...p, aiMsg]);
      setIsTyping(false);
    }, 1200 + Math.random() * 800);
  }, [input, isTyping, cardTitle]);

  const handleConfirmPlan = useCallback(() => {
    // Close modal — in a real app this would trigger page data refresh
    onClose();
  }, [onClose]);

  if (typeof window === "undefined" || !open) return null;

  const modalContent = (
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
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className="fixed z-[61] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] max-w-[92vw] h-[80vh] rounded-2xl glass-strong border border-border/50 shadow-2xl shadow-primary/10 flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
                  <Sparkles className="h-4.5 w-4.5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">AI Brainstorm</h3>
                  <p className="text-[11px] text-muted-foreground truncate max-w-[500px]">
                    {cardTitle}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0"
            >
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-3 ${
                    msg.role === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
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
                  <div className="flex flex-col gap-2 max-w-[75%]">
                    <div
                      className={`rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                        msg.role === "assistant"
                          ? "bg-muted/40 text-foreground/90"
                          : "bg-primary/15 text-foreground"
                      }`}
                    >
                      {msg.content}
                    </div>
                    {msg.showConfirm && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <Button
                          size="sm"
                          className="gap-2 text-xs"
                          onClick={handleConfirmPlan}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Confirm Research Plan
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-muted/40 px-4 py-3">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Thinking…
                    </span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input bar */}
            <div className="border-t border-border/50 p-4 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2 bg-muted/30 border border-border/50 rounded-xl px-4 py-2.5"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Explore ideas, ask questions, request changes…"
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-w-0"
                />
                <div className="flex items-center gap-1 border-l border-border/50 pl-2 shrink-0">
                  <button
                    type="button"
                    className="p-1.5 rounded-lg hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <Mic className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="p-1.5 rounded-lg hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>
                  <button
                    type="submit"
                    disabled={!input.trim() || isTyping}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                      input.trim() && !isTyping
                        ? "bg-primary text-primary-foreground hover:bg-primary/80"
                        : "text-muted-foreground opacity-40 cursor-not-allowed"
                    }`}
                  >
                    <SendHorizonal className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
