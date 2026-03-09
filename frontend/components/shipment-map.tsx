"use client";

import dynamic from "next/dynamic";

const ShipmentMapClient = dynamic(() => import("./shipment-map-client"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[300px] flex items-center justify-center bg-muted/20 border rounded-xl shadow-sm">
      <div className="animate-pulse bg-muted rounded-xl w-full h-full"></div>
    </div>
  ),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ShipmentMap(props: any) {
  return <ShipmentMapClient {...props} />;
}
