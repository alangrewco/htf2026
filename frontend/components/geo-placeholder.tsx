"use client";

import { useEffect, useRef, useState } from "react";
import type { GlobeInstance } from "globe.gl";
import { Anchor, Globe, MapPin, Navigation } from "lucide-react";
import { ROUTE_PATHS, type RouteNode } from "@/lib/fixtures/reference/routes";

type GlobeSignal = {
  id: string;
  title: string;
  summary: string;
  source: string;
  timestamp: string;
  lat: number;
  lng: number;
};

const HARDCODED_SIGNALS: GlobeSignal[] = [
  {
    id: "sig-houston",
    title: "Port of Houston Workers Strike Enters Week 3",
    summary:
      "Dockworkers union rejected the latest proposal, reducing ship handling capacity at the port.",
    source: "Reuters",
    timestamp: "10 hr ago",
    lat: 29.7604,
    lng: -95.3698,
  },
  {
    id: "sig-south-china-sea",
    title: "Typhoon Warning Issued for South China Sea",
    summary:
      "A Category 3 storm warning may pause vessel loading across multiple South China hubs.",
    source: "NOAA",
    timestamp: "11 hr ago",
    lat: 14.0,
    lng: 114.0,
  },
  {
    id: "sig-eu-carbon",
    title: "EU Carbon Border Tax Takes Effect",
    summary:
      "Revised import tax rules are expected to raise landed costs for selected industrial inputs.",
    source: "Financial Times",
    timestamp: "12 hr ago",
    lat: 50.8503,
    lng: 4.3517,
  },
  {
    id: "sig-red-sea",
    title: "Red Sea Shipping Disruptions Continue",
    summary:
      "Additional rerouting through the Cape is extending transit windows for Asia-Europe voyages.",
    source: "Lloyd's List",
    timestamp: "12 hr ago",
    lat: 12.6,
    lng: 43.3,
  },
  {
    id: "sig-panama-canal",
    title: "Panama Canal Drought Restrictions Extended",
    summary:
      "Transit slot limits remain in effect, with queue times still above seasonal averages.",
    source: "Canal Authority",
    timestamp: "13 hr ago",
    lat: 9.1012,
    lng: -79.4029,
  },
  {
    id: "sig-bangladesh",
    title: "Bangladesh Garment Factory Closures",
    summary: "Labor instability near supplier facilities increases short-term supply risk.",
    source: "AP News",
    timestamp: "13 hr ago",
    lat: 23.8103,
    lng: 90.4125,
  },
];

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const routeColors = [
  "#ff3366", "#33ccff", "#ff9933", "#66ff33", 
  "#cc33ff", "#ffcc00", "#00ffcc", "#ff0066", 
  "#99ff00", "#3366ff", "#ff5050", "#ffff66"
];

const pathsData = Object.entries(ROUTE_PATHS).map(([routeId, nodes], index) => ({
  id: routeId,
  path: nodes,
  color: routeColors[index % routeColors.length],
}));

const portsData = Object.entries(ROUTE_PATHS).flatMap(([routeId, nodes], index) =>
  nodes
    .filter((node) => node.isPort)
    .map((node) => ({
      ...node,
      color: routeColors[index % routeColors.length],
      routeId,
    }))
);

export function GeoPlaceholder() {
  const [globeReady, setGlobeReady] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const globeRef = useRef<GlobeInstance | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    let cancelled = false;

    const initGlobe = async () => {
      if (!containerRef.current) return;

      const Globe = (await import("globe.gl")).default;
      if (cancelled || !containerRef.current) return;

      const globe = new Globe(containerRef.current)
        .backgroundColor("rgba(0,0,0,0)")
        .globeImageUrl("https://unpkg.com/three-globe/example/img/earth-night.jpg")
        .backgroundImageUrl("https://unpkg.com/three-globe/example/img/night-sky.png")
        .pointLat("lat")
        .pointLng("lng")
        .pointRadius(0.8)
        .pointAltitude(0.025)
        .pointColor(() => "#a78bfa")
        .pointLabel((datum) => {
          const point = datum as GlobeSignal;
          return `
            <div style="max-width:280px;background:rgba(15,23,42,0.9);color:#e2e8f0;padding:10px 12px;border-radius:10px;border:1px solid rgba(148,163,184,0.25);font-size:13px;">
              <div style="font-weight:600;margin-bottom:4px;">${escapeHtml(point.title)}</div>
              <div style="margin-bottom:4px;">${escapeHtml(point.summary)}</div>
              <div style="opacity:0.85;">${escapeHtml(point.source)} · ${escapeHtml(point.timestamp)}</div>
            </div>
          `;
        })
        .labelsData(HARDCODED_SIGNALS)
        .labelLat("lat")
        .labelLng("lng")
        .labelText("title")
        .labelSize(1.15)
        .labelDotRadius(0.22)
        .labelColor(() => "#e2e8f0")
        .labelAltitude(0.015)
        .labelResolution(5)
        .pathsData(pathsData)
        .pathPoints("path")
        .pathPointLat((p: unknown) => (p as RouteNode).lat)
        .pathPointLng((p: unknown) => (p as RouteNode).lng)
        .pathColor((d: unknown) => (d as { color: string }).color)
        .pathDashLength(0.08)
        .pathDashGap(0.01)
        .pathDashAnimateTime(12000)
        .htmlElementsData(portsData)
        .htmlElement((d: unknown) => {
          const data = d as RouteNode & { color: string; routeId: string };
          const el = document.createElement("div");
          el.style.position = "relative";
          el.style.pointerEvents = "auto";
          el.style.cursor = "help";

          const icon = document.createElement("div");
          icon.innerHTML = "⚓";
          icon.style.color = data.color;
          icon.style.fontSize = "16px";
          icon.style.lineHeight = "1";

          const tooltip = document.createElement("div");
          const routeName = data.routeId.replace(/^route_|_1$/g, "").replace(/_/g, " ");
          const formattedRoute = routeName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          
          tooltip.innerHTML = `
            <div style="font-weight:600;margin-bottom:4px;">${escapeHtml(data.portName || "Port")}</div>
            <div style="margin-bottom:4px;">Major regional shipping hub node.</div>
            <div style="opacity:0.85;">Route · ${escapeHtml(formattedRoute)}</div>
          `;
          tooltip.style.position = "absolute";
          tooltip.style.bottom = "100%";
          tooltip.style.left = "50%";
          tooltip.style.transform = "translate(-50%, -8px)";
          tooltip.style.backgroundColor = "rgba(15,23,42,0.9)";
          tooltip.style.color = "#e2e8f0";
          tooltip.style.padding = "10px 12px";
          tooltip.style.borderRadius = "10px";
          tooltip.style.border = "1px solid rgba(148,163,184,0.25)";
          tooltip.style.fontSize = "13px";
          tooltip.style.whiteSpace = "nowrap";
          tooltip.style.pointerEvents = "none";
          tooltip.style.opacity = "0";
          tooltip.style.transition = "opacity 0.2s ease";
          tooltip.style.zIndex = "1000";
          
          el.appendChild(icon);
          el.appendChild(tooltip);
          
          el.onmouseenter = () => { tooltip.style.opacity = "1"; };
          el.onmouseleave = () => { tooltip.style.opacity = "0"; };
          
          return el;
        })
        .pointsData(HARDCODED_SIGNALS)
        .pointOfView({ lat: 20, lng: 15, altitude: 2.1 }, 0);

      const controls = globe.controls();
      controls.autoRotate = false;
      controls.autoRotateSpeed = 0;
      controls.enablePan = false;
      controls.minDistance = 140;
      controls.maxDistance = 420;

      const resize = () => {
        if (!containerRef.current) return;
        globe
          .width(containerRef.current.clientWidth)
          .height(containerRef.current.clientHeight);
      };

      resize();
      resizeObserverRef.current = new ResizeObserver(resize);
      resizeObserverRef.current.observe(containerRef.current);

      globeRef.current = globe;
      setGlobeReady(true);
    };

    void initGlobe();

    return () => {
      cancelled = true;
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      globeRef.current?._destructor();
      globeRef.current = null;
      setGlobeReady(false);
    };
  }, []);

  return (
    <div className="glass relative h-full overflow-hidden rounded-xl">
      <div ref={containerRef} className="absolute inset-0" />

      {!globeReady && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
          Loading globe...
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-background/90 via-background/45 to-transparent p-3">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary/70" />
          <h3 className="text-sm font-semibold text-foreground/90">
            Geographic Overview
          </h3>
        </div>
        <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {HARDCODED_SIGNALS.length} alerts
          </span>
          <span className="inline-flex items-center gap-1">
            <Navigation className="h-3 w-3" />
            {pathsData.length} routes mapped
          </span>
          <span className="inline-flex items-center gap-1">
            <Anchor className="h-3 w-3" />
            {portsData.length} ports
          </span>
        </div>
      </div>
    </div>
  );
}
