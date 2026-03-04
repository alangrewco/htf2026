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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChatModal } from "@/components/chat-modal";
import { skus, shipments, suppliers } from "@/lib/mock-data";

function CommandBarContent({
  variant = "page1",
}: {
  variant?: "page1" | "page2";
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get("tab") || "skus";
  const searchValue = searchParams.get("q") || "";
  const [chatOpen, setChatOpen] = useState(false);

  const handleSearchChange = useCallback(
    (value: string) => {
      if (variant === "page1") {
        // On page 1, clicking the search scrolls to page 2
        const target = document.getElementById("data-explorer-section");
        if (target) target.scrollIntoView({ behavior: "smooth" });
        return;
      }
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("q", value);
      } else {
        params.delete("q");
      }
      router.replace(`/?${params.toString()}#data-explorer-section`, { scroll: false });
    },
    [searchParams, router, variant]
  );

  const handleTabClick = useCallback(
    (tab: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.replace(`/?${params.toString()}#data-explorer-section`, {
        scroll: false,
      });

      // Also dispatch custom event for DataSection
      window.dispatchEvent(new CustomEvent("switch-tab", { detail: tab }));

      // If on page1, scroll down to data explorer
      if (variant === "page1") {
        const target = document.getElementById("data-explorer-section");
        if (target) {
          target.scrollIntoView({ behavior: "smooth" });
        }
      }
    },
    [searchParams, router, variant]
  );

  const tabs = [
    { value: "skus", label: "SKUs", icon: Package, count: skus.length },
    {
      value: "shipments",
      label: "Shipments",
      icon: Truck,
      count: shipments.length,
    },
    {
      value: "suppliers",
      label: "Suppliers",
      icon: Users,
      count: suppliers.length,
    },
  ];

  return (
    <>
      <div className="flex items-center gap-2 w-full px-4 py-2 glass-strong rounded-xl">
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-muted/50 border border-border/50 rounded-lg p-0.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => handleTabClick(tab.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
                <Badge
                  variant="secondary"
                  className="ml-0.5 text-[10px] h-4 px-1.5"
                >
                  {tab.count}
                </Badge>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative ml-2">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Fuzzy search…"
            className="h-8 w-44 pl-8 text-xs bg-input/30 border-border/50"
            value={variant === "page2" ? searchValue : ""}
            readOnly={variant === "page1"}
            onChange={(e) => {
              if (variant === "page2") handleSearchChange(e.target.value);
            }}
            onClick={() => {
              if (variant === "page1") {
                const target = document.getElementById("data-explorer-section");
                if (target) target.scrollIntoView({ behavior: "smooth" });
              }
            }}
          />
        </div>

        {/* Filter & Sort */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={() => {
            if (variant === "page1") {
              const target = document.getElementById("data-explorer-section");
              if (target) target.scrollIntoView({ behavior: "smooth" });
            }
          }}
        >
          <Filter className="h-3.5 w-3.5" />
          Filter
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={() => {
            if (variant === "page1") {
              const target = document.getElementById("data-explorer-section");
              if (target) target.scrollIntoView({ behavior: "smooth" });
            }
          }}
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          Sort
        </Button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Chat bar */}
        <div
          className="flex items-center gap-1 bg-muted/30 border border-border/50 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-accent/30 transition-colors group"
          onClick={() => setChatOpen(true)}
        >
          <MessageSquare className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors mx-2">
            Ask HarborGuard AI…
          </span>
          <div className="flex items-center gap-1 border-l border-border/50 pl-2">
            <button
              className="p-1 rounded hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setChatOpen(true);
              }}
            >
              <Mic className="h-3.5 w-3.5" />
            </button>
            <button
              className="p-1 rounded hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setChatOpen(true);
              }}
            >
              <Paperclip className="h-3.5 w-3.5" />
            </button>
            <button
              className="p-1 rounded hover:bg-primary/20 text-primary transition-colors cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setChatOpen(true);
              }}
            >
              <SendHorizonal className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <ChatModal open={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}

export function CommandBar({
  variant = "page1",
}: {
  variant?: "page1" | "page2";
}) {
  return (
    <Suspense fallback={<div className="h-12" />}>
      <CommandBarContent variant={variant} />
    </Suspense>
  );
}
