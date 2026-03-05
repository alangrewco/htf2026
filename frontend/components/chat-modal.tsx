"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Maximize2,
  Minimize2,
  Mic,
  Paperclip,
  SendHorizonal,
  Bot,
  User,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const WELCOME_SUGGESTIONS = [
  "Show me SKUs at highest risk",
  "What disruptions affect my Houston shipments?",
  "Summarize active supplier risks",
  "Which shipments are delayed?",
];

export function ChatModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const msgIdRef = useRef(0);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback((text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;

    const userId = ++msgIdRef.current;
    const now = new Date();
    const ts = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const userMsg: Message = {
      id: `user-${userId}`,
      role: "user",
      content: msg,
      timestamp: ts,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Simulate AI response
    setTimeout(() => {
      const aiId = ++msgIdRef.current;
      const aiTs = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      const aiMsg: Message = {
        id: `ai-${aiId}`,
        role: "assistant",
        content: `I'm analyzing your query: "${msg}". This is a placeholder response — the AI integration will be connected soon. I would typically search across your supply chain data to provide actionable insights here.`,
        timestamp: aiTs,
      };
      setMessages((prev) => [...prev, aiMsg]);
    }, 800);
  }, [input]);

  const handleClose = () => {
    setIsFullscreen(false);
    onClose();
  };

  const modalContent = (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`fixed z-[61] flex flex-col glass-strong border border-border/50 shadow-2xl shadow-primary/10 ${
              isFullscreen
                ? "inset-0 rounded-none"
                : "bottom-6 right-6 w-[480px] h-[600px] max-h-[80vh] rounded-2xl"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">HarborGuard AI</h3>
                  <p className="text-[10px] text-muted-foreground">
                    Supply chain intelligence assistant
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  onClick={handleClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-4 py-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                    <Bot className="h-7 w-7 text-primary" />
                  </div>
                  <h4 className="text-sm font-semibold mb-1">
                    How can I help?
                  </h4>
                  <p className="text-xs text-muted-foreground text-center mb-6 max-w-[280px]">
                    Ask questions about your supply chain, disruptions, SKUs,
                    shipments, or suppliers.
                  </p>
                  <div className="grid grid-cols-2 gap-2 w-full max-w-[360px]">
                    {WELCOME_SUGGESTIONS.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => handleSend(suggestion)}
                        className="rounded-lg border border-border/50 bg-card/50 p-3 text-[11px] text-left text-muted-foreground hover:text-foreground hover:bg-accent/30 hover:border-border transition-colors cursor-pointer"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-2.5 ${
                        msg.role === "user" ? "flex-row-reverse" : ""
                      }`}
                    >
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                          msg.role === "user"
                            ? "bg-primary/20"
                            : "bg-muted/50"
                        }`}
                      >
                        {msg.role === "user" ? (
                          <User className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </div>
                      <div
                        className={`max-w-[75%] rounded-xl px-3 py-2 ${
                          msg.role === "user"
                            ? "bg-primary/15 text-foreground"
                            : "bg-muted/30 text-foreground"
                        }`}
                      >
                        <p className="text-xs leading-relaxed">{msg.content}</p>
                        <span className="block mt-1 text-[10px] text-muted-foreground">
                          {msg.timestamp}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                  <div ref={bottomRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input area */}
            <div className="px-4 py-3 border-t border-border/50 shrink-0">
              <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-input/30 px-3 py-2">
                <button className="p-1 rounded hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0">
                  <Mic className="h-4 w-4" />
                </button>
                <button className="p-1 rounded hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0">
                  <Paperclip className="h-4 w-4" />
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Type a message…"
                  className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim()}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer shrink-0 ${
                    input.trim()
                      ? "bg-primary text-primary-foreground hover:bg-primary/80"
                      : "text-muted-foreground"
                  }`}
                >
                  <SendHorizonal className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (typeof window === "undefined") return null;
  return createPortal(modalContent, document.body);
}
