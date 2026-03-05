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
  { label: "Home", icon: HomeIcon, href: "/dashboard", id: "home" },
  { label: "SKUs", icon: Package, href: "/dashboard?tab=skus#data-explorer-section", id: "skus", tab: "skus" },
  { label: "Shipments", icon: Truck, href: "/dashboard?tab=shipments#data-explorer-section", id: "shipments", tab: "shipments" },
  { label: "Suppliers", icon: Users, href: "/dashboard?tab=suppliers#data-explorer-section", id: "suppliers", tab: "suppliers" },
  { label: "News", icon: Newspaper, href: "/dashboard/news", id: "news" },
  { label: "Analytics", icon: BarChart3, href: "/dashboard/analytics", id: "analytics" },
] as const;

export function NavbarContent() {
  const [commandOpen, setCommandOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<string>("home-section");
  const activeTab = searchParams.get("tab") || "skus";

  useEffect(() => {
    if (pathname !== "/dashboard") return;

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
      if (pathname === "/dashboard") {
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

          const params = new URLSearchParams(searchParams.toString());
          params.set("tab", link.tab);
          router.replace(`/dashboard?${params.toString()}#data-explorer-section`, { scroll: false });

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
    if (pathname === "/dashboard") {
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
      <header
        className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between px-6 lg:px-12"
        style={{
          background: "rgba(12, 12, 18, 0.92)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(228, 224, 216, 0.06)",
        }}
      >
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <span className="text-sm font-semibold tracking-wide" style={{ color: "#e4e0d8" }}>
            HARBOR
            <span style={{ color: "#e8c872" }}>GUARD</span>
            <span className="ml-1 text-xs font-medium" style={{ color: "#6b6b78" }}>
              AI
            </span>
          </span>
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isLinkActive(link);
            return (
              <Link
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link)}
                className="relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors duration-200"
                style={{
                  color: active ? "#e8c872" : "#6b6b78",
                }}
              >
                <Icon className="h-3.5 w-3.5" />
                {link.label}
                {active && (
                  <span
                    className="absolute bottom-0 left-3 right-3 h-px"
                    style={{ background: "#e8c872" }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right side: search + profile */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCommandOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs transition-colors cursor-pointer"
            style={{ color: "#6b6b78", border: "1px solid rgba(228,224,216,0.08)" }}
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Search…</span>
            <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 px-1.5 text-[10px] font-mono" style={{ color: "#3a3a44", border: "1px solid rgba(228,224,216,0.06)" }}>
              ⌘K
            </kbd>
          </button>

          <button className="flex h-8 w-8 items-center justify-center transition-colors cursor-pointer" style={{ color: "#6b6b78" }}>
            <Settings className="h-4 w-4" />
          </button>
          <button
            className="flex h-8 w-8 items-center justify-center transition-colors cursor-pointer"
            style={{ background: "rgba(232, 200, 114, 0.1)", color: "#e8c872" }}
          >
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

export function Navbar() {
  return (
    <Suspense fallback={<div className="h-14 fixed top-0 left-0 right-0 z-50" style={{ background: "rgba(12, 12, 18, 0.92)" }} />}>
      <NavbarContent />
    </Suspense>
  );
}
