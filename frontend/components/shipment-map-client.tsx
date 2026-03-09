"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers in next.js
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;

const ShipIcon = L.divIcon({
  html: `<div style="background-color: #3b82f6; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.96 17.06c1.19.86 2.65 1.35 4.14 1.35 1.15 0 2.27-.33 3.24-.95.96.61 2.08.94 3.23.94 1.48 0 2.94-.48 4.13-1.34l-1.35-8.8a1.5 1.5 0 0 0-1.48-1.27H9.13a1.5 1.5 0 0 0-1.48 1.28l-1.35 8.8z"/><path d="M12 9V3"/><path d="M9 6h6"/></svg></div>`,
  className: "custom-ship-icon",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const AlertIcon = L.divIcon({
  html: `<div style="background-color: #ef4444; color: white; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>`,
  className: "custom-alert-icon",
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const PortIcon = L.divIcon({
  html: `<div style="background-color: #10b981; color: white; border-radius: 50%; width: 14px; height: 14px; display: flex; align-items: center; justify-content: center; border: 2px solid white;"><div style="width:6px;height:6px;background-color:white;border-radius:50%"></div></div>`,
  className: "custom-port-icon",
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function MapBoundsUpdater({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], animate: true, maxZoom: 6 });
    }
  }, [points, map]);

  return null;
}

export default function ShipmentMapClient({
  routeNodes,
  shipLocation,
  articlesWithGeo,
}: {
  routeNodes: { lat: number; lng: number; isPort?: boolean; portName?: string }[];
  shipLocation: { lat: number; lng: number } | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  articlesWithGeo: any[];
}) {
  const polylinePath: [number, number][] = routeNodes.map((n) => [n.lat, n.lng]);
  const boundsPoints = [...polylinePath];

  return (
    <div className="w-full h-full rounded-xl overflow-hidden shadow-sm border">
      <MapContainer
        center={boundsPoints.length ? boundsPoints[Math.floor(boundsPoints.length / 2)] : [0, 0]}
        zoom={3}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png"
        />

        {boundsPoints.length > 0 && <MapBoundsUpdater points={boundsPoints} />}

        <Polyline
          positions={polylinePath}
          color="#3b82f6"
          weight={4}
          opacity={0.8}
          dashArray="10, 10"
        />

        {routeNodes.map((node, i) =>
          node.isPort ? (
            <Marker key={`port-${i}`} position={[node.lat, node.lng]} icon={PortIcon}>
              <Popup className="text-sm rounded-lg p-0 font-sans">
                <strong>{node.portName}</strong>
              </Popup>
            </Marker>
          ) : null
        )}

        {shipLocation && (
          <Marker position={[shipLocation.lat, shipLocation.lng]} icon={ShipIcon}>
             <Popup className="text-sm rounded-lg p-0 font-sans">
                <strong>Current Estimated Location</strong>
             </Popup>
          </Marker>
        )}

        {articlesWithGeo.map((article) => (
          <Marker 
              key={article.id} 
              position={[article.lat, article.lng]} 
              icon={AlertIcon}
              eventHandlers={{
                mouseover: (e) => {
                  e.target.openPopup();
                },
                mouseout: (e) => {
                  e.target.closePopup();
                }
              }}
          >
            <Popup className="custom-popup" closeButton={false}>
              <div className="max-w-[280px] p-1 font-sans text-[13px] leading-snug">
                <div className="font-semibold mb-1">{article.title}</div>
                <div className="mb-2 text-muted-foreground">{article.summary}</div>
                <div className="opacity-80 text-xs text-muted-foreground">
                  {article.source} · {article.timestamp}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
