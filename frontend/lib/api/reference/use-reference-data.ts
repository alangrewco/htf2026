"use client";

import { useMemo } from "react";
import {
  useListShipments,
  useListSkus,
  useListSuppliers,
  useListPorts,
} from "@/sdk/reference/reference";
import type {
  Shipment as ApiShipment,
  Sku as ApiSku,
  Supplier as ApiSupplier,
  ReferenceItem,
} from "@/sdk/model";
import { mockShipmentListResponse } from "@/lib/fixtures/reference/shipments";
import { mockSkuListResponse } from "@/lib/fixtures/reference/skus";
import { mockSupplierListResponse } from "@/lib/fixtures/reference/suppliers";
import { mockPortListResponse } from "@/lib/fixtures/reference/ports";

const useMockFallback = process.env.NEXT_PUBLIC_USE_MSW !== "false";
const EMPTY_SKUS: ApiSku[] = [];
const EMPTY_SUPPLIERS: ApiSupplier[] = [];
const EMPTY_SHIPMENTS: ApiShipment[] = [];
const EMPTY_PORTS: ReferenceItem[] = [];

// Re-export API types directly — no divergent view types
export type { ApiSku as Sku, ApiShipment as Shipment, ApiSupplier as Supplier };

export const useReferenceData = () => {
  const skuQuery = useListSkus();
  const supplierQuery = useListSuppliers();
  const shipmentQuery = useListShipments();
  const portQuery = useListPorts();

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

  const rawPorts =
    portQuery.data?.status === 200
      ? portQuery.data.data.items
      : useMockFallback
        ? mockPortListResponse.items
        : EMPTY_PORTS;

  // ── Lookup maps ──────────────────────────────────────────

  const skuMap = useMemo(
    () => new Map(rawSkus.map((s) => [s.id, s])),
    [rawSkus],
  );

  const supplierMap = useMemo(
    () => new Map(rawSuppliers.map((s) => [s.id, s])),
    [rawSuppliers],
  );

  const shipmentMap = useMemo(
    () => new Map(rawShipments.map((s) => [s.id, s])),
    [rawShipments],
  );

  const portMap = useMemo(
    () => new Map(rawPorts.map((p) => [p.id, p])),
    [rawPorts],
  );

  // ── Derived associations (shipment is the "central node") ──

  /** supplier_id → Shipment[] */
  const shipmentsBySupplier = useMemo(() => {
    const map = new Map<string, ApiShipment[]>();
    for (const s of rawShipments) {
      const existing = map.get(s.supplier_id);
      if (existing) existing.push(s);
      else map.set(s.supplier_id, [s]);
    }
    return map;
  }, [rawShipments]);

  /** sku_id → Shipment[] */
  const shipmentsBySku = useMemo(() => {
    const map = new Map<string, ApiShipment[]>();
    for (const s of rawShipments) {
      for (const skuId of s.sku_ids) {
        const existing = map.get(skuId);
        if (existing) existing.push(s);
        else map.set(skuId, [s]);
      }
    }
    return map;
  }, [rawShipments]);

  // ── Helpers for ID → name resolution ───────────────────

  /** Resolve a port ID to its human-readable name, fallback to the ID itself */
  const portName = useMemo(() => {
    return (portId: string) => portMap.get(portId)?.name ?? portId;
  }, [portMap]);

  /** Resolve a supplier ID to its name */
  const supplierName = useMemo(() => {
    return (supplierId: string) =>
      supplierMap.get(supplierId)?.name ?? supplierId;
  }, [supplierMap]);

  /** Resolve a SKU ID to its name */
  const skuName = useMemo(() => {
    return (skuId: string) => skuMap.get(skuId)?.name ?? skuId;
  }, [skuMap]);

  /**
   * For a given SKU ID, resolve supplier names from sku.supplier_ids.
   */
  const supplierNamesForSku = useMemo(() => {
    return (skuId: string): string[] => {
      const sku = skuMap.get(skuId);
      if (!sku) return [];
      return sku.supplier_ids
        .map((id) => supplierName(id))
        .sort((a, b) => a.localeCompare(b));
    };
  }, [skuMap, supplierName]);

  /**
   * For a given SKU ID, derive shipment codes from shipment data.
   * Sorted alphabetically.
   */
  const shipmentCodesForSku = useMemo(() => {
    return (skuId: string): string[] => {
      const shipments = shipmentsBySku.get(skuId) ?? [];
      return shipments
        .map((s) => s.shipment_code)
        .sort((a, b) => a.localeCompare(b));
    };
  }, [shipmentsBySku]);

  /**
   * For a given supplier ID, resolve SKU names from SKUs that list this supplier.
   */
  const skuNamesForSupplier = useMemo(() => {
    return (supplierId: string): string[] => {
      return rawSkus
        .filter((sku) => sku.supplier_ids.includes(supplierId))
        .map((sku) => sku.name)
        .sort((a, b) => a.localeCompare(b));
    };
  }, [rawSkus]);

  return {
    // Raw API-typed arrays
    skus: rawSkus,
    suppliers: rawSuppliers,
    shipments: rawShipments,
    ports: rawPorts,

    // Lookup maps
    skuMap,
    supplierMap,
    shipmentMap,
    portMap,

    // Derived associations
    shipmentsBySupplier,
    shipmentsBySku,

    // Name resolution helpers
    portName,
    supplierName,
    skuName,
    supplierNamesForSku,
    shipmentCodesForSku,
    skuNamesForSupplier,

    // Loading / error states
    isLoading:
      (!skuQuery.data && !skuQuery.error) ||
      (!supplierQuery.data && !supplierQuery.error) ||
      (!shipmentQuery.data && !shipmentQuery.error) ||
      (!portQuery.data && !portQuery.error),
    hasError: Boolean(
      skuQuery.error ||
        supplierQuery.error ||
        shipmentQuery.error ||
        portQuery.error,
    ),
  };
};
