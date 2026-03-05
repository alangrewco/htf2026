"use client";

import { useMemo } from "react";
import {
  useListShipments,
  useListSkus,
  useListSuppliers,
} from "@/sdk/reference/reference";
import type {
  Shipment as ApiShipment,
  Sku as ApiSku,
  Supplier as ApiSupplier,
} from "@/sdk/model";
import {
  mockShipmentListResponse,
  shipmentDetailsByCode,
} from "@/lib/fixtures/reference/shipments";
import { mockSkuListResponse, skuMetricsById } from "@/lib/fixtures/reference/skus";
import {
  mockSupplierListResponse,
  supplierMetricsById,
} from "@/lib/fixtures/reference/suppliers";

const useMockFallback = process.env.NEXT_PUBLIC_USE_MSW !== "false";
const EMPTY_SKUS: ApiSku[] = [];
const EMPTY_SUPPLIERS: ApiSupplier[] = [];
const EMPTY_SHIPMENTS: ApiShipment[] = [];

export type SKU = {
  id: string;
  name: string;
  category: string;
  riskScore: number;
  riskLevel: "critical" | "high" | "medium" | "low";
  revenue: number;
  topSuppliers: string[];
  topShipments: string[];
};

export type Shipment = {
  id: string;
  status: "in-transit" | "delayed" | "planned" | "delivered";
  origin: string;
  destination: string;
  carrier: string;
  eta: string;
  skus: string[];
};

export type Supplier = {
  id: string;
  name: string;
  region: string;
  riskRating: "low" | "medium" | "high";
  activeShipments: number;
  plannedShipments: number;
  recurringShipments: number;
  skus: string[];
};

const deriveRisk = (score: number): SKU["riskLevel"] => {
  if (score >= 85) return "critical";
  if (score >= 65) return "high";
  if (score >= 40) return "medium";
  return "low";
};

const toSkuView = (sku: ApiSku, index: number): SKU => {
  const metrics = skuMetricsById[sku.id];
  const fallbackScore = Math.max(5, 92 - index * 9);
  const categoryFromDescription = sku.description.split("-")[0]?.trim() || "General";

  return {
    id: sku.sku_code,
    name: sku.name,
    category: metrics?.category ?? categoryFromDescription,
    riskScore: metrics?.riskScore ?? fallbackScore,
    riskLevel: metrics?.riskLevel ?? deriveRisk(fallbackScore),
    revenue: metrics?.revenue ?? 0,
    topSuppliers: metrics?.topSuppliers ?? [],
    topShipments: metrics?.topShipments ?? [],
  };
};

const toSupplierView = (supplier: ApiSupplier): Supplier => {
  const metrics = supplierMetricsById[supplier.id];

  return {
    id: supplier.id,
    name: supplier.name,
    region: metrics?.region ?? supplier.country,
    riskRating: metrics?.riskRating ?? "medium",
    activeShipments: metrics?.activeShipments ?? 0,
    plannedShipments: metrics?.plannedShipments ?? 0,
    recurringShipments: metrics?.recurringShipments ?? 0,
    skus: metrics?.skus ?? [],
  };
};

const toShipmentStatus = (status: ApiShipment["status"]): Shipment["status"] => {
  if (status === "in_transit") return "in-transit";
  if (status === "delayed") return "delayed";
  if (status === "planned" || status === "cancelled") return "planned";
  return "delivered";
};

const toShipmentView = (shipment: ApiShipment): Shipment => {
  const details = shipmentDetailsByCode[shipment.shipment_code];

  return {
    id: shipment.shipment_code,
    status: toShipmentStatus(shipment.status),
    origin: details?.origin ?? shipment.origin_port_id,
    destination: details?.destination ?? shipment.destination_port_id,
    carrier: details?.carrier ?? shipment.route_id,
    eta: details?.etaLabel ?? shipment.eta,
    skus: shipment.sku_ids,
  };
};

export const useReferenceData = () => {
  const skuQuery = useListSkus();
  const supplierQuery = useListSuppliers();
  const shipmentQuery = useListShipments();

  const rawSkus =
    skuQuery.data?.status === 200
      ? skuQuery.data.data.items
      : useMockFallback
        ? mockSkuListResponse.items
        : EMPTY_SKUS;

  const rawSuppliers =
    supplierQuery.data?.status === 200
      ? supplierQuery.data.data.items
      : useMockFallback
        ? mockSupplierListResponse.items
        : EMPTY_SUPPLIERS;

  const rawShipments =
    shipmentQuery.data?.status === 200
      ? shipmentQuery.data.data.items
      : useMockFallback
        ? mockShipmentListResponse.items
        : EMPTY_SHIPMENTS;

  const skus = useMemo(() => rawSkus.map(toSkuView), [rawSkus]);
  const suppliers = useMemo(() => rawSuppliers.map(toSupplierView), [rawSuppliers]);
  const shipments = useMemo(() => rawShipments.map(toShipmentView), [rawShipments]);

  return {
    skus,
    suppliers,
    shipments,
    isLoading:
      (!skuQuery.data && !skuQuery.error) ||
      (!supplierQuery.data && !supplierQuery.error) ||
      (!shipmentQuery.data && !shipmentQuery.error),
    hasError: Boolean(skuQuery.error || supplierQuery.error || shipmentQuery.error),
  };
};
