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
import { mockShipmentListResponse } from "@/lib/fixtures/reference/shipments";
import { mockSkuListResponse } from "@/lib/fixtures/reference/skus";
import { mockSupplierListResponse } from "@/lib/fixtures/reference/suppliers";

export const handlers = [
  getListSkusMockHandler(mockSkuListResponse),
  getListSuppliersMockHandler(mockSupplierListResponse),
  getListShipmentsMockHandler(mockShipmentListResponse),
  ...getReferenceMock(),
  ...getArticlesMock(),
  ...getIncidentsMock(),
  ...getIngestionMock(),
  ...getProposalsMock(),
  ...getCompanyConfigMock(),
  ...getFeedbackMock(),
];
