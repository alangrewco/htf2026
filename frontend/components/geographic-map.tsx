"use client";

import React, { useMemo } from "react";
import {
    ComposableMap,
    Geographies,
    Geography,
    Marker,
    Line,
} from "react-simple-maps";
import { useGeographicData, GeoNode } from "@/lib/api/ui/geographic-map";

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

export function GeographicMap() {
    const { data, isLoading, error } = useGeographicData();

    // Create a map of nodes by ID for fast path lookups
    const nodesMap = useMemo(() => {
        if (!data) return new Map<string, GeoNode>();
        return new Map(data.nodes.map((node) => [node.id, node]));
    }, [data]);

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-background rounded-none border border-border">
                <div className="animate-pulse text-muted-foreground text-sm uppercase tracking-wider font-semibold">Loading Geographic Data...</div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-background rounded-none border border-border">
                <div className="text-destructive text-sm">Failed to load geographic data.</div>
            </div>
        );
    }

    return (
        <div className="flex h-full w-full flex-col relative bg-background border border-border rounded-none overflow-hidden">
            {/* Header matching dashboard professional aesthetic */}
            <div className="absolute top-0 left-0 right-0 z-10 px-4 py-3 bg-background/80 backdrop-blur-md border-b border-border flex justify-between items-center">
                <h3 className="text-sm font-semibold text-foreground/80 uppercase tracking-widest">Global Operations</h3>
                <div className="flex gap-4">
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="w-2 h-2 bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></span> Warning
                    </span>
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="w-2 h-2 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span> Critical
                    </span>
                </div>
            </div>

            <div className="w-full h-full">
                {/* We use a slight adjusted projection to put the US and East Asia in a clearer view for our specific hubs */}
                <ComposableMap
                    projection="geoMercator"
                    projectionConfig={{
                        scale: 130,
                        center: [10, 30] // Centers closer to active routes (EU + US + Asia)
                    }}
                    className="w-full h-full outline-none"
                >
                    <Geographies geography={geoUrl}>
                        {({ geographies }) =>
                            geographies.map((geo) => (
                                <Geography
                                    key={geo.rsmKey}
                                    geography={geo}
                                    fill="#151518" /* Dark charcoal base */
                                    stroke="#262626" /* Subtle border */
                                    strokeWidth={0.5}
                                    style={{
                                        default: { outline: "none", pointerEvents: "none" },
                                        hover: { outline: "none", pointerEvents: "none" },
                                        pressed: { outline: "none", pointerEvents: "none" },
                                    }}
                                />
                            ))
                        }
                    </Geographies>

                    {/* Render Routes */}
                    {data.routes.map((route) => {
                        const startNode = nodesMap.get(route.from);
                        const endNode = nodesMap.get(route.to);

                        if (!startNode || !endNode) return null;

                        let strokeColor = "#3f3f46"; // dim active
                        let strokeDasharray = "0";

                        if (route.status === "disrupted") {
                            strokeColor = "#ef4444"; // red
                            strokeDasharray = "4 4";
                        } else if (route.status === "delayed") {
                            strokeColor = "#f59e0b"; // amber
                            strokeDasharray = "4 4";
                        } else if (route.status === "active") {
                            strokeColor = "#52525b"; // slightly prominent active
                        }

                        return (
                            <Line
                                key={route.id}
                                from={startNode.coordinates}
                                to={endNode.coordinates}
                                stroke={strokeColor}
                                strokeWidth={1.5}
                                strokeDasharray={strokeDasharray}
                            />
                        );
                    })}

                    {/* Render Nodes (Markers) */}
                    {data.nodes.map((node) => {
                        let markerColor = "#a1a1aa"; // default normal
                        let glowColor = "none";

                        if (node.status === "critical") {
                            markerColor = "#ef4444"; // red
                            glowColor = "rgba(239,68,68,0.4)";
                        } else if (node.status === "warning") {
                            markerColor = "#f59e0b"; // amber
                            glowColor = "rgba(245,158,11,0.4)";
                        } else {
                            markerColor = "#71717a"; // normal
                            glowColor = "rgba(113,113,122,0.2)";
                        }

                        return (
                            <Marker key={node.id} coordinates={node.coordinates}>
                                <g className="cursor-pointer group">
                                    <circle r={8} fill={glowColor} className="animate-pulse" />
                                    <circle r={3} fill={markerColor} stroke="#0c0c12" strokeWidth={1} />
                                    {/* Tooltip text showing on hover */}
                                    <text
                                        textAnchor="middle"
                                        y={-12}
                                        className="text-[9px] fill-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity font-medium tracking-wider"
                                        style={{ pointerEvents: 'none' }}
                                    >
                                        {node.name}
                                    </text>
                                </g>
                            </Marker>
                        );
                    })}
                </ComposableMap>
            </div>
        </div>
    );
}
