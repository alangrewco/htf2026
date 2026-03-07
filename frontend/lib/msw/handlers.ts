import { getListArticlesMockHandler, getGetArticleEnrichmentMockHandler, getGetArticleMockHandler } from "@/sdk/articles/articles.msw";
import { getCompanyConfigMock } from "@/sdk/company-config/company-config.msw";
import { getFeedbackMock } from "@/sdk/feedback/feedback.msw";
import { getIncidentsMock } from "@/sdk/incidents/incidents.msw";
import {
  getCreateIngestionRunMockHandler,
  getGetIngestionRunMockHandler,
  getGetIngestionStatusMockHandler,
  getListIngestionRunsMockHandler,
} from "@/sdk/ingestion/ingestion.msw";
import { getProposalsMock } from "@/sdk/proposals/proposals.msw";
import { ListIngestionRunsResponse } from "@/sdk/ingestion/ingestion.zod";
import { mockIngestionRunListResponse } from "@/lib/fixtures/reference/ingestion-runs";
import {
  getListShipmentsMockHandler,
  getListSkusMockHandler,
  getListSuppliersMockHandler,
  getListPortsMockHandler,
  getListRoutesMockHandler,
  getReferenceMock,
} from "@/sdk/reference/reference.msw";
import {
  ListShipmentsResponse,
  ListSkusResponse,
  ListSuppliersResponse,
  ListPortsResponse,
  ListRoutesResponse,
} from "@/sdk/reference/reference.zod";
import { mockShipmentListResponse } from "@/lib/fixtures/reference/shipments";
import { mockSkuListResponse } from "@/lib/fixtures/reference/skus";
import { mockSupplierListResponse } from "@/lib/fixtures/reference/suppliers";
import { mockPortListResponse } from "@/lib/fixtures/reference/ports";
import { mockRouteListResponse } from "@/lib/fixtures/reference/routes";
import { mockArticleListResponse, mockArticleEnrichments } from "@/lib/fixtures/articles";
import { ListArticlesResponse, GetArticleEnrichmentResponse } from "@/sdk/articles/articles.zod";
import { Enrichment } from "@/sdk/model";

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

const validatedPortListResponse = validateFixture(
  "/reference/ports",
  ListPortsResponse,
  mockPortListResponse
);

const validatedRouteListResponse = validateFixture(
  "/reference/routes",
  ListRoutesResponse,
  mockRouteListResponse
);

const validatedIngestionRunListResponse = validateFixture(
  "/ingestion/runs",
  ListIngestionRunsResponse,
  mockIngestionRunListResponse
);

const validatedArticleListResponse = validateFixture(
  "/articles",
  ListArticlesResponse,
  mockArticleListResponse
);

export const handlers = [
  getListSkusMockHandler(validatedSkuListResponse),
  getListSuppliersMockHandler(validatedSupplierListResponse),
  getListShipmentsMockHandler(validatedShipmentListResponse),
  getListPortsMockHandler(validatedPortListResponse),
  getListRoutesMockHandler(validatedRouteListResponse),
  ...getReferenceMock(),
  getListArticlesMockHandler(validatedArticleListResponse),
  getGetArticleMockHandler((info) => {
    const { articleId } = info.params;
    const article = validatedArticleListResponse.items.find(a => a.id === articleId);
    if (!article) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return new Response(null, { status: 404 }) as any;
    }
    return article;
  }),
  getGetArticleEnrichmentMockHandler((info) => {
    const { articleId } = info.params;
    const enrichment = mockArticleEnrichments[articleId as string];
    if (enrichment) {
      return validateFixture(`/articles/${articleId}/enrichment`, GetArticleEnrichmentResponse, enrichment) as Enrichment;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new Response(null, { status: 404 }) as any;
  }),
  ...getIncidentsMock(),
  getListIngestionRunsMockHandler(validatedIngestionRunListResponse),
  getCreateIngestionRunMockHandler(),
  getGetIngestionRunMockHandler(),
  getGetIngestionStatusMockHandler(),
  ...getProposalsMock(),
  ...getCompanyConfigMock(),
  ...getFeedbackMock(),
];
