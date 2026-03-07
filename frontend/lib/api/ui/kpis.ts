import useSwr from "swr";

export type KPIData = {
  revenueAtRisk: number;
  activeDisruptions: number;
  affectedSKUs: number;
  totalSKUs: number;
};

export const mockKPIData: KPIData = {
  revenueAtRisk: 2_340_000,
  activeDisruptions: 7,
  affectedSKUs: 34,
  totalSKUs: 128,
};

const getKpiData = async (): Promise<KPIData> => mockKPIData;

export const useKpiData = () => {
  return useSwr(["mock", "kpis"], getKpiData, {
    revalidateOnFocus: false,
  });
};
