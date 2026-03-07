import useSwr from "swr";
import { listIncidents } from "@/sdk/incidents/incidents";
import type { Incident } from "@/sdk/model";

export type IncidentGlobePoint = {
  id: string;
  articleId: string;
  reasoning: string;
  classification: Incident["classification"];
  status: Incident["status"];
  riskLevel: Incident["risk_level"];
  riskScore: number;
  updatedAt: string;
  lat: number;
  lng: number;
};

type IncidentGlobeData = {
  points: IncidentGlobePoint[];
  totalIncidents: number;
  unmappedIncidents: number;
};

const INCIDENT_PAGE_SIZE = 100;
const MAX_INCIDENT_PAGES = 100;

const fetchAllIncidents = async (): Promise<Incident[]> => {
  const all: Incident[] = [];
  let page = 1;

  while (page <= MAX_INCIDENT_PAGES) {
    const response = await listIncidents({
      page,
      page_size: INCIDENT_PAGE_SIZE,
    });

    if (response.status !== 200) {
      throw new Error(`Failed to load incidents (status ${response.status})`);
    }

    const { items, total } = response.data;
    all.push(...items);

    if (items.length === 0 || all.length >= total) {
      break;
    }

    page += 1;
  }

  return all;
};

const mapIncidentsToGlobeData = (incidents: Incident[]): IncidentGlobeData => {
  const points = incidents
    .filter(
      (incident): incident is Incident & { lat: number; lng: number } =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        typeof (incident as any).lat === "number" && typeof (incident as any).lng === "number"
    )
    .map((incident) => ({
      id: incident.id,
      articleId: incident.article_id,
      reasoning: incident.reasoning,
      classification: incident.classification,
      status: incident.status,
      riskLevel: incident.risk_level,
      riskScore: incident.risk_score,
      updatedAt: incident.updated_at,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lat: (incident as any).lat,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lng: (incident as any).lng,
    }));

  return {
    points,
    totalIncidents: incidents.length,
    unmappedIncidents: incidents.length - points.length,
  };
};

const getIncidentGlobeData = async (): Promise<IncidentGlobeData> => {
  const incidents = await fetchAllIncidents();
  return mapIncidentsToGlobeData(incidents);
};

export const useIncidentGlobeData = () => {
  return useSwr(["api", "incident-globe-data"], getIncidentGlobeData, {
    revalidateOnFocus: false,
  });
};
