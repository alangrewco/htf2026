"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Bot,
  User,
  Loader2,
  CheckCircle2,
  Circle,
  Play,
  SendHorizonal,
  Mail,
  HandHelping,
  Sparkles,
  PauseCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ExecutionStep } from "@/lib/api/ui/action-cards";
import { Streamdown } from "streamdown";

/* ── Chat message type ─────────────────────────────────── */
type ExecMessage = {
  id: string;
  role: "system" | "assistant" | "user";
  content: string;
  timestamp: Date;
  /** Attached step for inline UI */
  step?: ExecutionStep;
  /** Status of the step (only for assistant messages with a step) */
  stepStatus?: "running" | "done" | "waiting";
};

/* ── Component ─────────────────────────────────────────── */
export function ExecutePlanModal({
  open,
  onClose,
  actionLabel,
  executionSteps,
}: {
  open: boolean;
  onClose: () => void;
  actionLabel: string;
  executionSteps: ExecutionStep[];
}) {
  const [messages, setMessages] = useState<ExecMessage[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(-1);
  const [waitingForUser, setWaitingForUser] = useState(false);
  const [input, setInput] = useState("");
  const [allDone, setAllDone] = useState(false);
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [draftEdits, setDraftEdits] = useState<Record<string, { to: string; subject: string; body: string }>>({});
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(isPaused);
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const runningRef = useRef(false);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, waitingForUser]);

  // Reset on open
  useEffect(() => {
    if (open && executionSteps.length > 0) {
      setMessages([]);
      setCurrentStepIdx(-1);
      setWaitingForUser(false);
      setInput("");
      setAllDone(false);
      setShowFeedbackInput(false);
      setFeedbackSubmitted(false);
      setDraftEdits({});
      runningRef.current = false;
      // Start execution after a brief delay
      setTimeout(() => startExecution(), 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const addMessage = useCallback((msg: ExecMessage) => {
    setMessages((p) => [...p, msg]);
  }, []);

  const updateLastAssistantStep = useCallback(
    (stepStatus: "running" | "done" | "waiting") => {
      setMessages((p) => {
        const newMsgs = [...p];
        for (let i = newMsgs.length - 1; i >= 0; i--) {
          if (newMsgs[i].role === "assistant" && newMsgs[i].step) {
            newMsgs[i] = { ...newMsgs[i], stepStatus };
            break;
          }
        }
        return newMsgs;
      });
    },
    []
  );

  const processStep = useCallback(
    (idx: number) => {
      if (idx >= executionSteps.length) {
        // All done!
        const attemptDone = () => {
          if (isPausedRef.current) {
            setTimeout(attemptDone, 250);
            return;
          }
          addMessage({
            id: `exec-done-${Date.now()}`,
            role: "assistant",
            content:
              "✅ **All steps completed successfully!** The action plan has been fully executed. You can close this window now.",
            timestamp: new Date(),
          });
          setAllDone(true);
          runningRef.current = false;
        };
        setTimeout(attemptDone, 600);
        return;
      }

      const step = executionSteps[idx];
      setCurrentStepIdx(idx);

      // Announce the step
      addMessage({
        id: `exec-step-${step.id}`,
        role: "assistant",
        content: step.description,
        timestamp: new Date(),
        step,
        stepStatus: step.type === "autonomous" ? "running" : "waiting",
      });

      if (step.type === "autonomous") {
        const attemptComplete = () => {
          if (isPausedRef.current) {
            setTimeout(attemptComplete, 250);
            return;
          }
          updateLastAssistantStep("done");
          // Show preview result
          if (step.autonomousPreview) {
            addMessage({
              id: `exec-preview-${step.id}`,
              role: "assistant",
              content: step.autonomousPreview,
              timestamp: new Date(),
            });
          }
          // Move to next step
          const attemptNext = () => {
            if (isPausedRef.current) {
              setTimeout(attemptNext, 250);
              return;
            }
            processStep(idx + 1);
          };
          setTimeout(attemptNext, 800);
        };

        // Auto-advance after delay
        setTimeout(attemptComplete, 1500 + Math.random() * 1000);
      } else {
        // semi-autonomous or manual — wait for user
        setWaitingForUser(true);
        runningRef.current = false;
        if (step.type === "semi-autonomous" && step.draftContent) {
          setDraftEdits((prev) => ({
            ...prev,
            [step.id]: { ...step.draftContent! },
          }));
        }
      }
    },
    [executionSteps, addMessage, updateLastAssistantStep]
  );

  const startExecution = useCallback(() => {
    if (runningRef.current) return;
    runningRef.current = true;
    // Opening message
    addMessage({
      id: "exec-start",
      role: "assistant",
      content: `Starting execution of **"${actionLabel}"**. I'll walk you through each step — some I can handle automatically, others will need your input.`,
      timestamp: new Date(),
    });
    
    const attemptStart = () => {
      if (isPausedRef.current) {
        setTimeout(attemptStart, 250);
        return;
      }
      processStep(0);
    };
    setTimeout(attemptStart, 1000);
  }, [actionLabel, addMessage, processStep]);

  const handleUserAction = useCallback(
    (action: "approve" | "complete", text?: string) => {
      const stepIdx = currentStepIdx;
      const step = executionSteps[stepIdx];

      // Add user message
      const userContent =
        action === "approve"
          ? text || "Approved ✓"
          : text || "Done — completed as instructed ✓";

      addMessage({
        id: `exec-user-${Date.now()}`,
        role: "user",
        content: userContent,
        timestamp: new Date(),
      });

      updateLastAssistantStep("done");
      setWaitingForUser(false);
      setInput("");
      runningRef.current = true;

      // Acknowledge and move on
      const attemptAck = () => {
        if (isPausedRef.current) {
          setTimeout(attemptAck, 250);
          return;
        }
        const ack =
          step.type === "semi-autonomous"
            ? "Great — I'll send that out now. ✅"
            : "Thanks for confirming! Moving on to the next step. ✅";
        addMessage({
          id: `exec-ack-${Date.now()}`,
          role: "assistant",
          content: ack,
          timestamp: new Date(),
        });
        
        const attemptNext = () => {
          if (isPausedRef.current) {
            setTimeout(attemptNext, 250);
            return;
          }
          processStep(stepIdx + 1);
        };
        setTimeout(attemptNext, 800);
      };
      setTimeout(attemptAck, 600);
    },
    [currentStepIdx, executionSteps, addMessage, updateLastAssistantStep, processStep]
  );

  const handleSendMessage = useCallback(() => {
    if (!input.trim()) return;
    const text = input.trim();
    addMessage({
      id: `exec-user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    });
    setInput("");

    if (allDone) {
      setTimeout(() => {
        addMessage({
          id: `exec-assistant-feedback-${Date.now()}`,
          role: "assistant",
          content: "Thank you for the feedback. Next time, I will be more concise in writing emails.",
          timestamp: new Date(),
        });
      }, 600);
      setFeedbackSubmitted(true);
      setShowFeedbackInput(false);
    }
  }, [input, addMessage, allDone]);

  if (typeof window === "undefined" || !open) return null;

  const currentStep =
    currentStepIdx >= 0 && currentStepIdx < executionSteps.length
      ? executionSteps[currentStepIdx]
      : null;

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
            className="fixed z-[61] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] max-w-[94vw] h-[85vh] rounded-2xl glass-strong border border-border/50 shadow-2xl shadow-primary/10 flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20">
                  <Play className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Execute Action Plan</h3>
                  <p className="text-[11px] text-muted-foreground truncate max-w-[550px]">
                    {actionLabel}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {executionSteps.length > 0 && (
                  <span className="text-[11px] text-muted-foreground font-medium px-2 py-1 rounded-md bg-muted/30 border border-border/40">
                    Step {Math.min(currentStepIdx + 1, executionSteps.length)} of{" "}
                    {executionSteps.length}
                  </span>
                )}
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
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
                  transition={{ duration: 0.25 }}
                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""
                    }`}
                >
                  {/* Avatar */}
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${msg.role === "user"
                        ? "bg-accent text-foreground"
                        : "bg-primary/15 text-primary"
                      }`}
                  >
                    {msg.role === "user" ? (
                      <User className="h-3.5 w-3.5" />
                    ) : (
                      <Bot className="h-3.5 w-3.5" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex flex-col gap-2 max-w-[80%]">
                    {/* Step badge */}
                    {msg.step && (
                      <div className="flex items-center gap-2 text-[11px]">
                        <StepTypeBadge type={msg.step.type} />
                        <span className="font-medium text-foreground/80">
                          {msg.step.label}
                        </span>
                        {msg.stepStatus === "running" && (
                          <Loader2 className="h-3 w-3 animate-spin text-primary" />
                        )}
                        {msg.stepStatus === "done" && (
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                        )}
                        {msg.stepStatus === "waiting" && (
                          <Circle className="h-3 w-3 text-amber-400" />
                        )}
                      </div>
                    )}

                    {/* Bubble */}
                    <div
                      className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${msg.role === "user"
                          ? "bg-primary/15 text-foreground"
                          : "bg-muted/40 text-foreground/90"
                        }`}
                    >
                      {msg.role === "user" ? (
                        msg.content
                      ) : (
                        <Streamdown
                          mode="static"
                          className="prose prose-sm prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_strong]:font-semibold"
                        >
                          {msg.content}
                        </Streamdown>
                      )}
                    </div>

                    {/* Semi-autonomous: inline email editor */}
                    {msg.step?.type === "semi-autonomous" &&
                      msg.step.draftContent &&
                      msg.stepStatus !== "done" && (
                        <EmailDraftCard
                          stepId={msg.step.id}
                          draft={draftEdits[msg.step.id] || msg.step.draftContent}
                          onDraftChange={(field, value) =>
                            setDraftEdits((prev) => ({
                              ...prev,
                              [msg.step!.id]: {
                                ...(prev[msg.step!.id] || msg.step!.draftContent!),
                                [field]: value,
                              },
                            }))
                          }
                          onApprove={() =>
                            handleUserAction("approve", "Reviewed and approved the draft ✓")
                          }
                        />
                      )}

                    {/* Manual: instruction display */}
                    {msg.step?.type === "manual" &&
                      msg.step.manualInstruction &&
                      msg.stepStatus !== "done" && (
                        <ManualInstructionCard
                          instruction={msg.step.manualInstruction}
                          onMarkComplete={() =>
                            handleUserAction("complete")
                          }
                        />
                      )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Input bar */}
            <div className="border-t border-border/50 p-4 shrink-0">
              {waitingForUser && currentStep?.type === "manual" ? (
                /* Manual step — modified input bar */
                <div className="flex items-center gap-3">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="flex-1 flex items-center gap-2 bg-muted/30 border border-border/50 rounded-xl px-4 py-2.5"
                  >
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Update the agent on how it went, or report complications…"
                      className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-w-0"
                    />
                    <button
                      type="submit"
                      disabled={!input.trim()}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer shrink-0 ${input.trim()
                          ? "bg-primary text-primary-foreground hover:bg-primary/80"
                          : "text-muted-foreground opacity-40 cursor-not-allowed"
                        }`}
                    >
                      <SendHorizonal className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              ) : waitingForUser && currentStep?.type === "semi-autonomous" ? (
                /* Semi-autonomous — hint */
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-1">
                  <Mail className="h-3.5 w-3.5" />
                  Review and edit the draft above, then click Approve & Send
                </div>
              ) : allDone ? (
                /* All done */
                showFeedbackInput ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="flex-1 flex items-center gap-2 bg-muted/30 border border-border/50 rounded-xl px-4 py-2.5 w-full"
                  >
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Enter your feedback..."
                      className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-w-0"
                    />
                    <button
                      type="submit"
                      disabled={!input.trim()}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer shrink-0 ${input.trim()
                          ? "bg-primary text-primary-foreground hover:bg-primary/80"
                          : "text-muted-foreground opacity-40 cursor-not-allowed"
                        }`}
                    >
                      <SendHorizonal className="h-4 w-4" />
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 text-xs"
                      onClick={() => setShowFeedbackInput(true)}
                      disabled={feedbackSubmitted}
                    >
                      <Mail className="h-3.5 w-3.5" />
                      Feedback
                    </Button>
                    <Button
                      size="sm"
                      className="gap-2 text-xs"
                      onClick={onClose}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Close
                    </Button>
                  </div>
                )
              ) : (
                /* Normal / running — status + pause button above chat input */
                <div className="flex flex-col gap-3">
                  {/* Running status row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {isPaused ? (
                        <PauseCircle className="h-3.5 w-3.5" />
                      ) : (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      )}
                      {isPaused ? "Paused" : "Executing…"}
                    </div>
                    <button
                      onClick={() => setIsPaused((p) => !p)}
                      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${isPaused
                          ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                          : "border-amber-500/40 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
                        }`}
                    >
                      <PauseCircle className="h-3.5 w-3.5" />
                      {isPaused ? "Resume" : "Pause to Interject"}
                    </button>
                  </div>
                  {/* Chat input (always visible for mockup) */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="flex items-center gap-2 bg-muted/30 border border-border/50 rounded-xl px-4 py-2.5"
                  >
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Interject with a message…"
                      className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-w-0"
                    />
                    <button
                      type="submit"
                      disabled={!input.trim()}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer shrink-0 ${input.trim()
                          ? "bg-primary text-primary-foreground hover:bg-primary/80"
                          : "text-muted-foreground opacity-40 cursor-not-allowed"
                        }`}
                    >
                      <SendHorizonal className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}

/* ── Step type badge ───────────────────────────────────── */
function StepTypeBadge({
  type,
}: {
  type: "autonomous" | "semi-autonomous" | "manual";
}) {
  const config = {
    autonomous: {
      label: "Auto",
      icon: Sparkles,
      classes: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    },
    "semi-autonomous": {
      label: "Review",
      icon: Mail,
      classes: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    },
    manual: {
      label: "Manual",
      icon: HandHelping,
      classes: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    },
  };
  const c = config[type];
  const IconComp = c.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${c.classes}`}
    >
      <IconComp className="h-2.5 w-2.5" />
      {c.label}
    </span>
  );
}

/* ── Inline email editor card ──────────────────────────── */
function EmailDraftCard({
  stepId,
  draft,
  onDraftChange,
  onApprove,
}: {
  stepId: string;
  draft: { to: string; subject: string; body: string };
  onDraftChange: (field: "to" | "subject" | "body", value: string) => void;
  onApprove: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-xl border border-blue-500/30 bg-blue-500/5 overflow-hidden"
    >
      {/* Email header */}
      <div className="px-4 py-2.5 border-b border-blue-500/20 bg-blue-500/5 flex items-center gap-2">
        <Mail className="h-3.5 w-3.5 text-blue-400" />
        <span className="text-[11px] font-medium text-blue-400">
          Email Draft
        </span>
      </div>
      <div className="p-4 space-y-2.5">
        {/* To */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground font-medium w-12 shrink-0">
            To:
          </span>
          <input
            type="text"
            value={draft.to}
            onChange={(e) => onDraftChange("to", e.target.value)}
            className="flex-1 bg-transparent text-xs text-foreground border-b border-border/40 pb-1 focus:outline-none focus:border-blue-400 transition-colors"
          />
        </div>
        {/* Subject */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground font-medium w-12 shrink-0">
            Subject:
          </span>
          <input
            type="text"
            value={draft.subject}
            onChange={(e) => onDraftChange("subject", e.target.value)}
            className="flex-1 bg-transparent text-xs text-foreground border-b border-border/40 pb-1 focus:outline-none focus:border-blue-400 transition-colors"
          />
        </div>
        {/* Body */}
        <textarea
          value={draft.body}
          onChange={(e) => onDraftChange("body", e.target.value)}
          rows={8}
          className="w-full bg-muted/20 border border-border/40 rounded-lg p-3 text-xs text-foreground leading-relaxed focus:outline-none focus:border-blue-400 resize-y transition-colors"
        />
        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <Button
            size="sm"
            className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700"
            onClick={onApprove}
          >
            <CheckCircle2 className="h-3 w-3" />
            Approve & Send
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Manual instruction card ───────────────────────────── */
function ManualInstructionCard({
  instruction,
  onMarkComplete,
}: {
  instruction: string;
  onMarkComplete: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-xl border border-amber-500/30 bg-amber-500/5 overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-amber-500/20 bg-amber-500/5 flex items-center gap-2">
        <HandHelping className="h-3.5 w-3.5 text-amber-400" />
        <span className="text-[11px] font-medium text-amber-400">
          Action Required
        </span>
      </div>
      <div className="p-4">
        <Streamdown
          mode="static"
          className="prose prose-xs prose-invert max-w-none text-xs leading-relaxed [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_strong]:font-semibold mb-4"
        >
          {instruction}
        </Streamdown>
        <div className="flex items-center justify-end">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
            onClick={onMarkComplete}
          >
            <CheckCircle2 className="h-3 w-3" />
            Mark as Complete
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
