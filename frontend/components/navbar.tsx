"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useCallback } from "react";
import {
  Search,
  User,
  Settings,
  Package,
  Truck,
  Users,
  Newspaper,
  BarChart3,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const navLinks = [
  { label: "SKUs", icon: Package, href: "/#data", tab: "skus" },
  { label: "Shipments", icon: Truck, href: "/#data", tab: "shipments" },
  { label: "Suppliers", icon: Users, href: "/#data", tab: "suppliers" },
  { label: "News", icon: Newspaper, href: "/news" },
  { label: "Analytics", icon: BarChart3, href: "/analytics" },
] as const;

export function Navbar() {
  const [commandOpen, setCommandOpen] = useState(false);

  const handleNavClick = useCallback(
    (e: React.MouseEvent, link: (typeof navLinks)[number]) => {
      if ("tab" in link && link.tab) {
        e.preventDefault();
        const dataSection = document.getElementById("data-section");

        // Dispatch custom event to switch tab
        window.dispatchEvent(
          new CustomEvent("switch-tab", { detail: link.tab })
        );

        if (dataSection) {
          dataSection.scrollIntoView({ behavior: "smooth" });
        }
      }
    },
    []
  );

  return (
    <>
      <header className="glass-strong fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between px-5">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <Image
            src="/logo.png"
            alt="HarborGuard AI"
            width={28}
            height={28}
            className="rounded transition-transform group-hover:scale-110"
          />
          <span className="text-sm font-semibold tracking-wide text-foreground">
            HARBOR
            <span className="text-primary">GUARD</span>
            <span className="ml-1 text-xs font-medium text-muted-foreground">
              AI
            </span>
          </span>
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground rounded-md transition-colors hover:text-foreground hover:bg-accent"
              >
                <Icon className="h-3.5 w-3.5" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side: search + profile */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCommandOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-border bg-input/50 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent cursor-pointer"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Search…</span>
            <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-border bg-muted/50 px-1.5 text-[10px] font-mono text-muted-foreground">
              ⌘K
            </kbd>
          </button>

          <button className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground hover:bg-accent cursor-pointer">
            <Settings className="h-4 w-4" />
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary transition-colors hover:bg-primary/30 cursor-pointer">
            <User className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Command palette */}
      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="Search SKUs, shipments, suppliers, or type a command…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Quick Navigation">
            <CommandItem onSelect={() => setCommandOpen(false)}>
              <Package className="mr-2 h-4 w-4" />
              <span>Go to SKUs</span>
            </CommandItem>
            <CommandItem onSelect={() => setCommandOpen(false)}>
              <Truck className="mr-2 h-4 w-4" />
              <span>Go to Shipments</span>
            </CommandItem>
            <CommandItem onSelect={() => setCommandOpen(false)}>
              <Users className="mr-2 h-4 w-4" />
              <span>Go to Suppliers</span>
            </CommandItem>
            <CommandItem onSelect={() => setCommandOpen(false)}>
              <Newspaper className="mr-2 h-4 w-4" />
              <span>Open News Dashboard</span>
            </CommandItem>
            <CommandItem onSelect={() => setCommandOpen(false)}>
              <BarChart3 className="mr-2 h-4 w-4" />
              <span>Open Analytics</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
