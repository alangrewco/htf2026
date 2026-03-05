import useSwr from "swr";

export type Signal = {
  id: string;
  title: string;
  source: string;
  type: "geopolitical" | "weather" | "financial" | "logistics" | "labor";
  timestamp: string;
  summary: string;
};

export const mockLiveSignals: Signal[] = [
  {
    id: "sig-1",
    title: "Port of Houston Workers Strike Enters Week 3",
    source: "Reuters",
    type: "labor",
    timestamp: "2 min ago",
    summary:
      "Dockworkers union has rejected latest pay proposal. Ship handling degraded to ~1 vessel/day.",
  },
  {
    id: "sig-2",
    title: "Typhoon Warning Issued for South China Sea",
    source: "NOAA",
    type: "weather",
    timestamp: "18 min ago",
    summary:
      "Category 3 typhoon expected to impact Shenzhen port operations within 48 hours.",
  },
  {
    id: "sig-3",
    title: "EU Carbon Border Tax Takes Effect",
    source: "Financial Times",
    type: "financial",
    timestamp: "1 hr ago",
    summary:
      "New tariffs on carbon-intensive imports may increase costs for steel and aluminum SKUs by 8-12%.",
  },
  {
    id: "sig-4",
    title: "Red Sea Shipping Disruptions Continue",
    source: "Lloyd's List",
    type: "geopolitical",
    timestamp: "2 hr ago",
    summary:
      "Houthi attacks force continued rerouting via Cape of Good Hope, adding 10-14 days to Asia-Europe transit.",
  },
  {
    id: "sig-5",
    title: "Panama Canal Drought Restrictions Extended",
    source: "Canal Authority",
    type: "logistics",
    timestamp: "3 hr ago",
    summary:
      "Daily transit slots reduced to 24 from 36. Waiting times increased to 21 days on average.",
  },
  {
    id: "sig-6",
    title: "Bangladesh Garment Factory Closures",
    source: "AP News",
    type: "labor",
    timestamp: "5 hr ago",
    summary:
      "Political unrest leads to temporary factory shutdowns affecting textile supply.",
  },
];

const getLiveSignals = async (): Promise<Signal[]> => mockLiveSignals;

export const useLiveSignals = () => {
  return useSwr(["mock", "live-signals"], getLiveSignals, {
    revalidateOnFocus: false,
  });
};
