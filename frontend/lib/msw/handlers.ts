import { getArticlesMock } from "@/sdk/articles/articles.msw";
import { getCompanyConfigMock } from "@/sdk/company-config/company-config.msw";
import { getFeedbackMock } from "@/sdk/feedback/feedback.msw";
import { getIncidentsMock } from "@/sdk/incidents/incidents.msw";
import { getIngestionMock } from "@/sdk/ingestion/ingestion.msw";
import { getProposalsMock } from "@/sdk/proposals/proposals.msw";
import {
  getListShipmentsMockHandler,
  getListSkusMockHandler,
  getListSuppliersMockHandler,
  getReferenceMock,
} from "@/sdk/reference/reference.msw";
import {
  ListShipmentsResponse,
  ListSkusResponse,
  ListSuppliersResponse,
} from "@/sdk/reference/reference.zod";
import { mockShipmentListResponse } from "@/lib/fixtures/reference/shipments";
import { mockSkuListResponse } from "@/lib/fixtures/reference/skus";
import { mockSupplierListResponse } from "@/lib/fixtures/reference/suppliers";

const validateFixture = <T>(
  endpoint: string,
  schema: { safeParse: (input: unknown) => { success: true; data: T } | { success: false; error: { message: string } } },
  payload: unknown
): T => {
  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    throw new Error(
      `[MSW fixture validation] Invalid fixture for ${endpoint}: ${parsed.error.message}`
    );
  }

  return parsed.data;
};

const validatedSkuListResponse = validateFixture(
  "/reference/skus",
  ListSkusResponse,
  mockSkuListResponse
);

const validatedSupplierListResponse = validateFixture(
  "/reference/suppliers",
  ListSuppliersResponse,
  mockSupplierListResponse
);

const validatedShipmentListResponse = validateFixture(
  "/reference/shipments",
  ListShipmentsResponse,
  mockShipmentListResponse
);

export const handlers = [
  getListSkusMockHandler(validatedSkuListResponse),
  getListSuppliersMockHandler(validatedSupplierListResponse),
  getListShipmentsMockHandler(validatedShipmentListResponse),
  ...getReferenceMock(),
  ...getArticlesMock(),
  ...getIncidentsMock(),
  ...getIngestionMock(),
  ...getProposalsMock(),
  ...getCompanyConfigMock(),
  ...getFeedbackMock(),
];
