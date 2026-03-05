"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
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
  const scrollRef = useRef<HTMLDivElement>(null);
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
    const ts = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const userMsg: Message = {
      id: `user-${userId}`,
      role: "user",
      content: msg,
      timestamp: ts,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    setTimeout(() => {
      const aiId = ++msgIdRef.current;
      const aiTs = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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

  if (typeof window === "undefined" || !open) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] transition-opacity duration-200"
        style={{ background: "rgba(0,0,0,0.6)" }}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`fixed z-[61] flex flex-col transition-all duration-200 ${isFullscreen
            ? "inset-0"
            : "bottom-6 right-6 w-[480px] h-[600px] max-h-[80vh]"
          }`}
        style={{
          background: "#0c0c12",
          border: "1px solid rgba(228,224,216,0.08)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{ borderBottom: "1px solid rgba(228,224,216,0.06)" }}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" style={{ color: "#e8c872" }} />
            <div>
              <h3 className="text-sm font-medium" style={{ color: "#e4e0d8" }}>HarborGuard AI</h3>
              <p className="text-[10px]" style={{ color: "#3a3a44" }}>
                Supply chain intelligence assistant
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              className="h-7 w-7 flex items-center justify-center cursor-pointer"
              style={{ color: "#6b6b78" }}
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button
              className="h-7 w-7 flex items-center justify-center cursor-pointer"
              style={{ color: "#6b6b78" }}
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <Bot className="h-7 w-7 mb-4" style={{ color: "#e8c872" }} />
              <h4 className="text-sm font-medium mb-1" style={{ color: "#e4e0d8" }}>
                How can I help?
              </h4>
              <p className="text-xs text-center mb-6 max-w-[280px]" style={{ color: "#6b6b78" }}>
                Ask questions about your supply chain, disruptions, SKUs, shipments, or suppliers.
              </p>
              <div className="grid grid-cols-2 gap-2 w-full max-w-[360px]">
                {WELCOME_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSend(suggestion)}
                    className="p-3 text-[11px] text-left transition-colors cursor-pointer"
                    style={{
                      color: "#6b6b78",
                      border: "1px solid rgba(228,224,216,0.06)",
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center" style={{ color: msg.role === "user" ? "#e8c872" : "#6b6b78" }}>
                    {msg.role === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                  </div>
                  <div
                    className="max-w-[75%] px-3 py-2"
                    style={{
                      background: msg.role === "user" ? "rgba(232,200,114,0.08)" : "rgba(228,224,216,0.03)",
                      borderLeft: msg.role === "assistant" ? "2px solid rgba(228,224,216,0.06)" : undefined,
                    }}
                  >
                    <p className="text-xs leading-relaxed" style={{ color: "#e4e0d8" }}>{msg.content}</p>
                    <span className="block mt-1 text-[10px]" style={{ color: "#3a3a44" }}>
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="px-4 py-3 shrink-0" style={{ borderTop: "1px solid rgba(228,224,216,0.06)" }}>
          <div className="flex items-center gap-2 px-3 py-2" style={{ border: "1px solid rgba(228,224,216,0.06)" }}>
            <button className="p-1 cursor-pointer shrink-0" style={{ color: "#3a3a44" }}>
              <Mic className="h-4 w-4" />
            </button>
            <button className="p-1 cursor-pointer shrink-0" style={{ color: "#3a3a44" }}>
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
              className="flex-1 bg-transparent text-xs outline-none"
              style={{ color: "#e4e0d8" }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim()}
              className="p-1.5 transition-all cursor-pointer shrink-0"
              style={{
                color: input.trim() ? "#0c0c12" : "#3a3a44",
                background: input.trim() ? "#e8c872" : "transparent",
              }}
            >
              <SendHorizonal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
