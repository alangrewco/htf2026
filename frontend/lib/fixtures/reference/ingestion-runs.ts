export const mockIngestionRunListResponse = {
  items: [
    {
      id: "run-001",
      status: "running",
      started_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      finished_at: null,
      created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      stats: {
        articles_ingested: 142,
        articles_relevant: 18,
        incidents_created: 0,
        proposals_generated: 0
      },
      error: null
    },
    {
      id: "run-002",
      status: "queued",
      started_at: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
      finished_at: null,
      created_at: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
      stats: {
        articles_ingested: 0,
        articles_relevant: 0,
        incidents_created: 0,
        proposals_generated: 0
      },
      error: null
    },
    {
      id: "run-003",
      status: "completed",
      started_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      finished_at: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
      created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      stats: {
        articles_ingested: 10450,
        articles_relevant: 342,
        incidents_created: 12,
        proposals_generated: 5
      },
      error: null
    },
    {
      id: "run-004",
      status: "failed",
      started_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      finished_at: new Date(Date.now() - 1000 * 60 * 60 * 23.9).toISOString(),
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      stats: {
        articles_ingested: 53,
        articles_relevant: 0,
        incidents_created: 0,
        proposals_generated: 0
      },
      error: "Connection timeout while fetching upstream sources."
    }
  ],
  total: 4,
  page: 1,
  page_size: 20
};
