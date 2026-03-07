"use client";

import { useListIngestionRuns } from "@/sdk/ingestion/ingestion";
import { mockIngestionRunListResponse } from "@/lib/fixtures/reference/ingestion-runs";
import { IngestionRun } from "@/sdk/model";

const useMockFallback = process.env.NEXT_PUBLIC_USE_MSW !== "false";
const EMPTY_RUNS: IngestionRun[] = [];

export const useIngestionData = () => {
  const query = useListIngestionRuns();

  const rawRuns =
    query.data?.status === 200
      ? (query.data.data as unknown as { items: IngestionRun[] }).items || []
      : useMockFallback
        ? mockIngestionRunListResponse.items
        : EMPTY_RUNS;

  return {
    runs: rawRuns as IngestionRun[],
    isLoading: !query.data && !query.error,
    hasError: Boolean(query.error),
  };
};
