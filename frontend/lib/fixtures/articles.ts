import type { ArticleListResponse, Enrichment } from "@/sdk/model";

export const mockArticleListResponse: ArticleListResponse = {
  items: [
    {
      id: "art-2001",
      source: "Reuters",
      source_url: "https://www.reuters.com/world/us/houston-port-strike-2026-03-06/",
      headline: "Port of Houston Workers Strike Enters Week 3",
      title: "Port of Houston Workers Strike Enters Week 3",
      summary:
        "Dockworkers union rejected the latest proposal, reducing ship handling capacity at the port.",
      preview_text:
        "Labor action at Houston continues to pressure Gulf Coast routing plans for importers.",
      analysis:
        "Operational delays now extend beyond original estimates as contract talks remain stalled.",
      keywords: ["port", "labor", "houston", "delay"],
      tags: ["labor", "logistics"],
      source_name: "Reuters",
      body:
        "Dockworker labor action at the Port of Houston has entered its third week with no final agreement in place.",
      published_at: "2026-03-06T15:30:00Z",
      publish_datetime: "2026-03-06T15:30:00Z",
      preview_image_url: null,
      ingestion_run_id: "run-3101",
      processing_state: "evaluated",
      created_at: "2026-03-06T15:35:00Z",
      updated_at: "2026-03-06T15:36:00Z",
    },
    {
      id: "art-2002",
      source: "NOAA",
      source_url: "https://www.noaa.gov/weather/advisories/south-china-sea-typhoon-2026-03-06",
      headline: "Typhoon Warning Issued for South China Sea",
      title: "Typhoon Warning Issued for South China Sea",
      summary:
        "A Category 3 storm warning may pause vessel loading across multiple South China hubs.",
      preview_text:
        "Shenzhen and nearby terminals are preparing for preemptive closures within 48 hours.",
      analysis:
        "Short-term disruption risk is elevated while berth schedules are being reprioritized.",
      keywords: ["weather", "typhoon", "shenzhen"],
      tags: ["weather", "port"],
      source_name: "NOAA",
      body:
        "Meteorological authorities issued a high-severity warning covering critical shipping lanes in the South China Sea.",
      published_at: "2026-03-06T14:55:00Z",
      publish_datetime: "2026-03-06T14:55:00Z",
      preview_image_url: null,
      ingestion_run_id: "run-3101",
      processing_state: "evaluated",
      created_at: "2026-03-06T15:00:00Z",
      updated_at: "2026-03-06T15:00:00Z",
    },
    {
      id: "art-2003",
      source: "Financial Times",
      source_url: "https://www.ft.com/content/eu-carbon-border-tax-2026-03-06",
      headline: "EU Carbon Border Tax Takes Effect",
      title: "EU Carbon Border Tax Takes Effect",
      summary:
        "Revised import tax rules are expected to raise landed costs for selected industrial inputs.",
      preview_text:
        "Procurement teams are revising near-term sourcing assumptions for affected categories.",
      analysis:
        "The policy introduces medium-term margin pressure for exposed SKUs with limited supplier flexibility.",
      keywords: ["financial", "policy", "tariff"],
      tags: ["financial", "risk"],
      source_name: "Financial Times",
      body:
        "The latest carbon-border framework adds cost pressure on import-heavy supply chains in energy-intensive categories.",
      published_at: "2026-03-06T14:10:00Z",
      publish_datetime: "2026-03-06T14:10:00Z",
      preview_image_url: null,
      ingestion_run_id: "run-3100",
      processing_state: "evaluated",
      created_at: "2026-03-06T14:16:00Z",
      updated_at: "2026-03-06T14:17:00Z",
    },
    {
      id: "art-2004",
      source: "Lloyd's List",
      source_url: "https://lloydslist.com/news/red-sea-rerouting-update-2026-03-06",
      headline: "Red Sea Shipping Disruptions Continue",
      title: "Red Sea Shipping Disruptions Continue",
      summary:
        "Additional rerouting through the Cape is extending transit windows for Asia-Europe voyages.",
      preview_text:
        "Carrier schedule reliability remains pressured as diversions compound network congestion.",
      analysis:
        "Sustained rerouting is likely to drive both delay risk and incremental freight spend.",
      keywords: ["shipping", "route", "red sea"],
      tags: ["logistics", "geopolitical"],
      source_name: "Lloyd's List",
      body:
        "Carriers reported continued detours around conflict-adjacent waterways, prolonging end-to-end transit times.",
      published_at: "2026-03-06T13:45:00Z",
      publish_datetime: "2026-03-06T13:45:00Z",
      preview_image_url: null,
      ingestion_run_id: "run-3099",
      processing_state: "evaluated",
      created_at: "2026-03-06T13:50:00Z",
      updated_at: "2026-03-06T13:52:00Z",
    },
    {
      id: "art-2005",
      source: "Canal Authority",
      source_url: "https://www.pancanal.com/notices/transit-restrictions-2026-03-06",
      headline: "Panama Canal Drought Restrictions Extended",
      title: "Panama Canal Drought Restrictions Extended",
      summary:
        "Transit slot limits remain in effect, with queue times still above seasonal averages.",
      preview_text:
        "Capacity controls continue to force longer planning buffers for ocean shipments.",
      analysis:
        "Extended restrictions are increasing schedule variability on key eastbound trade lanes.",
      keywords: ["canal", "capacity", "transit"],
      tags: ["logistics"],
      source_name: "Canal Authority",
      body:
        "Canal operators confirmed additional weeks of constrained daily transits because of ongoing water-level challenges.",
      published_at: "2026-03-06T12:55:00Z",
      publish_datetime: "2026-03-06T12:55:00Z",
      preview_image_url: null,
      ingestion_run_id: "run-3098",
      processing_state: "evaluated",
      created_at: "2026-03-06T13:00:00Z",
      updated_at: "2026-03-06T13:01:00Z",
    },
    {
      id: "art-2006",
      source: "AP News",
      source_url: "https://apnews.com/article/supplier-labor-closures-2026-03-06",
      headline: "Bangladesh Garment Factory Closures",
      title: "Bangladesh Garment Factory Closures",
      summary:
        "Temporary factory shutdowns are disrupting near-term output across selected textile suppliers.",
      preview_text:
        "Procurement teams are tracking allocation risks as labor disruptions continue.",
      analysis:
        "Labor-led production instability is adding elevated replenishment risk for dependent SKUs.",
      keywords: ["labor", "supplier", "textile"],
      tags: ["labor", "supplier"],
      source_name: "AP News",
      body:
        "Regional labor unrest led to temporary factory closures, reducing near-term export capacity for apparel inputs.",
      published_at: "2026-03-06T12:05:00Z",
      publish_datetime: "2026-03-06T12:05:00Z",
      preview_image_url: null,
      ingestion_run_id: "run-3097",
      processing_state: "evaluated",
      created_at: "2026-03-06T12:10:00Z",
      updated_at: "2026-03-06T12:11:00Z",
    },
  ],
  total: 6,
  page: 1,
  page_size: 20,
};

export const mockArticleEnrichments: Record<string, Enrichment> = {
  "art-2001": {
    article_id: "art-2001",
    is_relevant: true,
    relevance_tags: ["shipment"],
    horizon: "short_term",
    geo: {
      countries: ["United States"],
      ports: ["Houston"],
      route_ids: [],
      lat: 29.76,
      lng: -95.36
    },
    impact_window: {
      start_at: "2026-03-06T15:30:00Z",
      end_at: "2026-03-20T15:30:00Z",
      confidence: 0.90
    },
    matched_entities: {
      sku_ids: ["sku-1", "sku-2"],
      supplier_ids: ["sup-1"]
    },
    risk_score: 85,
    risk_level: "high",
    explanation: "Strike has significantly reduced capacity causing major delays."
  },
  "art-2002": {
    article_id: "art-2002",
    is_relevant: true,
    relevance_tags: ["weather", "shipment"],
    horizon: "short_term",
    geo: {
      countries: ["China"],
      ports: ["Shenzhen"],
      route_ids: [],
      lat: 22.54,
      lng: 114.05
    },
    impact_window: {
      start_at: "2026-03-06T14:55:00Z",
      end_at: "2026-03-10T14:55:00Z",
      confidence: 0.80
    },
    matched_entities: {
      sku_ids: ["sku-3"],
      supplier_ids: ["sup-2"]
    },
    risk_score: 75,
    risk_level: "high",
    explanation: "Typhoon is causing temporary port closures."
  }
};
