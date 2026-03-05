"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useCallback, useEffect, Suspense } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Search,
  User,
  Settings,
  Package,
  Truck,
  Users,
  Newspaper,
  BarChart3,
  Home as HomeIcon,
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
  { label: "Home", icon: HomeIcon, href: "/", id: "home" },
  { label: "SKUs", icon: Package, href: "/?tab=skus#data-explorer-section", id: "skus", tab: "skus" },
  { label: "Shipments", icon: Truck, href: "/?tab=shipments#data-explorer-section", id: "shipments", tab: "shipments" },
  { label: "Suppliers", icon: Users, href: "/?tab=suppliers#data-explorer-section", id: "suppliers", tab: "suppliers" },
  { label: "News", icon: Newspaper, href: "/news", id: "news" },
  { label: "Analytics", icon: BarChart3, href: "/analytics", id: "analytics" },
] as const;

export function NavbarContent() {
  const [commandOpen, setCommandOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<string>("home-section");
  const activeTab = searchParams.get("tab") || "skus";

  // Track active section on the home page
  useEffect(() => {
    if (pathname !== "/") return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.5 }
    );

    const sections = ["home-section", "data-explorer-section"];
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [pathname]);


  const handleNavClick = useCallback(
    (e: React.MouseEvent, link: (typeof navLinks)[number]) => {
      if (pathname === "/") {
        if (link.id === "home") {
          e.preventDefault();
          const target = document.getElementById("home-section");
          if (target) {
            target.scrollIntoView({ behavior: "smooth" });
          }
          return;
        }

        if ("tab" in link && link.tab) {
          e.preventDefault();
          const target = document.getElementById("data-explorer-section");

          // Update URL so the tab param stays in sync (single source of truth)
          const params = new URLSearchParams(searchParams.toString());
          params.set("tab", link.tab);
          router.replace(`/?${params.toString()}#data-explorer-section`, { scroll: false });

          // Also dispatch custom event so DataSection can react immediately
          window.dispatchEvent(
            new CustomEvent("switch-tab", { detail: link.tab })
          );

          if (target) {
            target.scrollIntoView({ behavior: "smooth" });
          }
        }
      }
    },
    [pathname, searchParams, router]
  );

  const isLinkActive = (link: (typeof navLinks)[number]) => {
    if (pathname === "/") {
      if (link.id === "home") return activeSection === "home-section";
      if ("tab" in link && link.tab) {
        return activeSection === "data-explorer-section" && activeTab === link.tab;
      }
      return false;
    }
    return pathname === link.href;
  };

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
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200",
                  isLinkActive(link)
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <Icon className={cn("h-3.5 w-3.5", isLinkActive(link) && "text-primary")} />
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

/** Navbar height in Tailwind‑compatible units. Change here to update everywhere. */
export const NAVBAR_HEIGHT = "h-14"; // 3.5rem / 56px
export const NAVBAR_HEIGHT_CLASS = "pt-14";
export const NAVBAR_HEIGHT_REM = "3.5rem";

/** Invisible spacer that matches the fixed navbar height. Drop this at the
 *  top of any page whose content would otherwise be hidden behind the navbar. */
export function NavbarSpacer() {
  return <div className={NAVBAR_HEIGHT} aria-hidden />;
}

export function Navbar() {
  return (
    <Suspense fallback={<div className="h-14 glass-strong fixed top-0 left-0 right-0 z-50" />}>
      <NavbarContent />
    </Suspense>
  );
}
