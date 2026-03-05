"use client";

import { useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  Filter,
  ArrowUpDown,
  Package,
  Truck,
  Users,
  Mic,
  Paperclip,
  SendHorizonal,
  MessageSquare,
} from "lucide-react";
import { ChatModal } from "@/components/chat-modal";
import { skus, shipments, suppliers } from "@/lib/mock-data";

function CommandBarContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get("tab") || "skus";
  const searchValue = searchParams.get("q") || "";
  const [chatOpen, setChatOpen] = useState(false);

  const handleSearchChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("q", value);
      } else {
        params.delete("q");
      }
      router.replace(`/dashboard?${params.toString()}`, { scroll: false });
    },
    [searchParams, router]
  );

  const handleTabClick = useCallback(
    (tab: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.replace(`/dashboard?${params.toString()}`, { scroll: false });

      window.dispatchEvent(new CustomEvent("switch-tab", { detail: tab }));

      const target = document.getElementById("data-explorer-section");
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    },
    [searchParams, router]
  );

  const tabs = [
    { value: "skus", label: "SKUs", icon: Package, count: skus.length },
    { value: "shipments", label: "Shipments", icon: Truck, count: shipments.length },
    { value: "suppliers", label: "Suppliers", icon: Users, count: suppliers.length },
  ];

  return (
    <>
      <div
        className="flex items-center gap-3 w-full px-4 py-2"
        style={{
          background: "#0c0c12",
          borderTop: "1px solid rgba(228,224,216,0.06)",
          borderBottom: "1px solid rgba(228,224,216,0.06)",
        }}
      >
        {/* Tabs */}
        <div className="flex items-center gap-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => handleTabClick(tab.value)}
                className="relative flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-colors duration-200 cursor-pointer"
                style={{
                  color: isActive ? "#e4e0d8" : "#6b6b78",
                }}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
                <span className="text-[10px] ml-0.5" style={{ color: "#3a3a44" }}>
                  {tab.count}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 left-4 right-4 h-px" style={{ background: "#e8c872" }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative ml-2">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: "#3a3a44" }} />
          <input
            placeholder="Fuzzy search…"
            className="h-8 w-44 pl-8 text-xs bg-transparent outline-none"
            style={{
              color: "#e4e0d8",
              borderBottom: "1px solid rgba(228,224,216,0.08)",
            }}
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        {/* Filter & Sort */}
        <button
          className="h-8 px-3 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          style={{ color: "#6b6b78", border: "1px solid rgba(228,224,216,0.06)" }}
        >
          <Filter className="h-3.5 w-3.5" />
          Filter
        </button>
        <button
          className="h-8 px-3 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          style={{ color: "#6b6b78", border: "1px solid rgba(228,224,216,0.06)" }}
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          Sort
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Chat bar */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 cursor-pointer group transition-colors"
          style={{ border: "1px solid rgba(228,224,216,0.06)" }}
          onClick={() => setChatOpen(true)}
        >
          <MessageSquare className="h-3.5 w-3.5" style={{ color: "#6b6b78" }} />
          <span className="text-xs mx-1" style={{ color: "#6b6b78" }}>
            Ask HarborGuard AI…
          </span>
          <div className="flex items-center gap-1" style={{ borderLeft: "1px solid rgba(228,224,216,0.06)", paddingLeft: "8px" }}>
            <button className="p-1 cursor-pointer" style={{ color: "#3a3a44" }} onClick={(e) => { e.stopPropagation(); setChatOpen(true); }}>
              <Mic className="h-3.5 w-3.5" />
            </button>
            <button className="p-1 cursor-pointer" style={{ color: "#3a3a44" }} onClick={(e) => { e.stopPropagation(); setChatOpen(true); }}>
              <Paperclip className="h-3.5 w-3.5" />
            </button>
            <button className="p-1 cursor-pointer" style={{ color: "#e8c872" }} onClick={(e) => { e.stopPropagation(); setChatOpen(true); }}>
              <SendHorizonal className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <ChatModal open={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}

export function CommandBar() {
  return (
    <Suspense fallback={<div className="h-12" />}>
      <CommandBarContent />
    </Suspense>
  );
}
