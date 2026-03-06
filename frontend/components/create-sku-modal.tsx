"use client";

import { useState, useCallback } from "react";
import {
  WizardShell,
  ImportSection,
  FormField,
  SelectField,
  EntityPickerOrCreate,
  type PickerItem,
} from "@/components/create-modal-shared";
import { Input } from "@/components/ui/input";
import { useReferenceData } from "@/lib/api/reference/use-reference-data";
import { useCreateSku, useCreateSupplier, useCreateShipment } from "@/sdk/reference/reference";
import { MasterStatus } from "@/sdk/model";
import type { CreateSkuRequest, CreateShipmentRequest } from "@/sdk/model";
import { useSWRConfig } from "swr";

const STEPS = ["SKU Details", "Suppliers", "Shipments"];

// ── Inline supplier form data ────────────────────────────

interface InlineSupplier {
  key: string;
  supplier_code: string;
  name: string;
  country: string;
  contact_email: string;
}

function emptyInlineSupplier(): InlineSupplier {
  return {
    key: crypto.randomUUID(),
    supplier_code: "",
    name: "",
    country: "",
    contact_email: "",
  };
}

// ── Inline shipment form data ────────────────────────────

interface InlineShipment {
  key: string;
  shipment_code: string;
  status: string;
  origin_port_id: string;
  destination_port_id: string;
  eta: string;
}

function emptyInlineShipment(): InlineShipment {
  return {
    key: crypto.randomUUID(),
    shipment_code: "",
    status: "planned",
    origin_port_id: "",
    destination_port_id: "",
    eta: "",
  };
}

// ── Main Component ───────────────────────────────────────

export function CreateSkuModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { suppliers, shipments, ports } = useReferenceData();
  const createSku = useCreateSku();
  const createSupplier = useCreateSupplier();
  const createShipment = useCreateShipment();
  const { mutate } = useSWRConfig();

  // Step state
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  // Step 1: SKU details
  const [skuForm, setSkuForm] = useState<CreateSkuRequest>({
    sku_code: "",
    name: "",
    description: "",
    unit_of_measure: "",
    status: MasterStatus.active,
  });

  // Step 2: Suppliers
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);
  const [inlineSuppliers, setInlineSuppliers] = useState<InlineSupplier[]>([]);
  const [editingSupplier, setEditingSupplier] = useState<InlineSupplier | null>(null);

  // Step 3: Shipments
  const [selectedShipmentIds, setSelectedShipmentIds] = useState<string[]>([]);
  const [inlineShipments, setInlineShipments] = useState<InlineShipment[]>([]);
  const [editingShipment, setEditingShipment] = useState<InlineShipment | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset
  const reset = useCallback(() => {
    setStep(0);
    setDirection(1);
    setSkuForm({ sku_code: "", name: "", description: "", unit_of_measure: "", status: MasterStatus.active });
    setSelectedSupplierIds([]);
    setInlineSuppliers([]);
    setEditingSupplier(null);
    setSelectedShipmentIds([]);
    setInlineShipments([]);
    setEditingShipment(null);
  }, []);

  const handleOpenChange = useCallback(
    (o: boolean) => {
      if (!o) reset();
      onOpenChange(o);
    },
    [onOpenChange, reset]
  );

  // Navigation
  const goNext = () => {
    // Commit any open inline editing form
    if (step === 1 && editingSupplier && editingSupplier.name) {
      setInlineSuppliers((prev) => [...prev, editingSupplier]);
      setEditingSupplier(null);
    }
    if (step === 2 && editingShipment && editingShipment.shipment_code) {
      setInlineShipments((prev) => [...prev, editingShipment]);
      setEditingShipment(null);
    }
    setDirection(1);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const goBack = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  };

  // Validation
  const canAdvance =
    step === 0
      ? Boolean(skuForm.sku_code && skuForm.name)
      : true; // steps 2 and 3 are optional

  // Submit
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // 0. Commit any still-open editing forms (user may have clicked Create
      //    without explicitly hitting "Confirm" on the inline entry list).
      const finalInlineSuppliers = editingSupplier?.name
        ? [...inlineSuppliers, editingSupplier]
        : inlineSuppliers;
      const finalInlineShipments = editingShipment?.shipment_code
        ? [...inlineShipments, editingShipment]
        : inlineShipments;

      // 1. Create inline suppliers first — we need their IDs before creating shipments.
      const createdSupplierIds: string[] = [];
      for (const s of finalInlineSuppliers) {
        const res = await createSupplier.trigger({
          supplier_code: s.supplier_code || `SUP-${Date.now()}`,
          name: s.name,
          country: s.country,
          contact_email: s.contact_email,
          status: MasterStatus.active,
        });
        if (res.status === 201) createdSupplierIds.push(res.data.id);
      }

      // All supplier IDs for this SKU (existing selected + newly created).
      const allSupplierIds = [...selectedSupplierIds, ...createdSupplierIds];

      // 2. Create the SKU.
      const skuRes = await createSku.trigger(skuForm);
      const newSkuId = skuRes.status === 201 ? skuRes.data.id : null;
      if (!newSkuId) throw new Error("Failed to create SKU");

      // 3. Create inline shipments, each linked to the new SKU.
      //    If there are multiple suppliers, replicate the shipment for each supplier
      //    (API constraint: one supplier_id per shipment).
      const suppliersForShipments = allSupplierIds.length > 0 ? allSupplierIds : [""];
      for (const sh of finalInlineShipments) {
        for (const supplierId of suppliersForShipments) {
          const suffix = suppliersForShipments.length > 1 ? `-${supplierId.slice(-4)}` : "";
          await createShipment.trigger({
            shipment_code: sh.shipment_code + suffix,
            status: sh.status as CreateShipmentRequest["status"],
            origin_port_id: sh.origin_port_id,
            destination_port_id: sh.destination_port_id,
            route_id: "",
            supplier_id: supplierId,
            sku_ids: [newSkuId],
            eta: sh.eta
              ? new Date(sh.eta).toISOString()
              : new Date().toISOString(),
          });
        }
      }

      // NOTE: Selected *existing* shipments cannot be updated to include the new SKU
      // via the current API (no PATCH /shipments/{id}/skus). See TODO.md.

      // 4. Invalidate all list caches so the new entities appear in the UI.
      mutate((key: unknown) => typeof key === "string", undefined, { revalidate: true });

      handleOpenChange(false);
    } catch (err) {
      console.error("Failed to create SKU:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Picker items
  const supplierPickerItems: PickerItem[] = suppliers.map((s) => ({
    id: s.id,
    label: s.name,
    sub: s.supplier_code,
  }));

  const shipmentPickerItems: PickerItem[] = shipments.map((s) => ({
    id: s.id,
    label: s.shipment_code,
    sub: s.status,
  }));

  const portOptions = ports.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  return (
    <WizardShell
      open={open}
      onOpenChange={handleOpenChange}
      title="New SKU"
      description="Create a new SKU and optionally link suppliers and shipments."
      steps={STEPS}
      currentStep={step}
      direction={direction}
      onBack={goBack}
      onNext={goNext}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      canAdvance={canAdvance}
    >
      {step === 0 && (
        <div className="space-y-4">
          <ImportSection />
          <div className="grid grid-cols-2 gap-3">
            <FormField label="SKU Code" required>
              <Input
                className="h-8 text-xs"
                placeholder="e.g. SKU-001"
                value={skuForm.sku_code}
                onChange={(e) => setSkuForm((f) => ({ ...f, sku_code: e.target.value }))}
              />
            </FormField>
            <FormField label="Name" required>
              <Input
                className="h-8 text-xs"
                placeholder="Product name"
                value={skuForm.name}
                onChange={(e) => setSkuForm((f) => ({ ...f, name: e.target.value }))}
              />
            </FormField>
          </div>
          <FormField label="Description">
            <Input
              className="h-8 text-xs"
              placeholder="Brief description"
              value={skuForm.description}
              onChange={(e) => setSkuForm((f) => ({ ...f, description: e.target.value }))}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Unit of Measure">
              <Input
                className="h-8 text-xs"
                placeholder="e.g. unit, kg, pallet"
                value={skuForm.unit_of_measure}
                onChange={(e) => setSkuForm((f) => ({ ...f, unit_of_measure: e.target.value }))}
              />
            </FormField>
            <FormField label="Status">
              <SelectField
                value={skuForm.status}
                onChange={(v) => setSkuForm((f) => ({ ...f, status: v as CreateSkuRequest["status"] }))}
                options={[
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ]}
              />
            </FormField>
          </div>
        </div>
      )}

      {step === 1 && (
        <EntityPickerOrCreate
          entityLabel="suppliers"
          existingItems={supplierPickerItems}
          selectedIds={selectedSupplierIds}
          onToggleId={(id) =>
            setSelectedSupplierIds((prev) =>
              prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
            )
          }
          inlineEntries={inlineSuppliers.map((s) => ({
            key: s.key,
            node: (
              <div className="text-xs space-y-0.5 pr-5">
                <div className="font-medium">{s.name}</div>
                <div className="text-muted-foreground">
                  {s.supplier_code} · {s.country}
                </div>
              </div>
            ),
          }))}
          onRemoveInline={(key) =>
            setInlineSuppliers((prev) => prev.filter((s) => s.key !== key))
          }
          inlineCreateSlot={
            editingSupplier ? (
              <div className="rounded-lg border border-dashed border-primary/30 p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    className="h-7 text-xs"
                    placeholder="Supplier code"
                    value={editingSupplier.supplier_code}
                    onChange={(e) =>
                      setEditingSupplier((s) => s && { ...s, supplier_code: e.target.value })
                    }
                  />
                  <Input
                    className="h-7 text-xs"
                    placeholder="Name"
                    value={editingSupplier.name}
                    onChange={(e) =>
                      setEditingSupplier((s) => s && { ...s, name: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    className="h-7 text-xs"
                    placeholder="Country"
                    value={editingSupplier.country}
                    onChange={(e) =>
                      setEditingSupplier((s) => s && { ...s, country: e.target.value })
                    }
                  />
                  <Input
                    className="h-7 text-xs"
                    placeholder="Contact email"
                    value={editingSupplier.contact_email}
                    onChange={(e) =>
                      setEditingSupplier((s) => s && { ...s, contact_email: e.target.value })
                    }
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setEditingSupplier(null)}
                    className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (editingSupplier.name) {
                        setInlineSuppliers((prev) => [...prev, editingSupplier]);
                        setEditingSupplier(null);
                      }
                    }}
                    className="text-[11px] text-primary font-medium hover:text-primary/80 cursor-pointer"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            ) : null
          }
          onAddInline={() => setEditingSupplier(emptyInlineSupplier())}
        />
      )}

      {step === 2 && (
        <EntityPickerOrCreate
          entityLabel="shipments"
          existingItems={shipmentPickerItems}
          selectedIds={selectedShipmentIds}
          onToggleId={(id) =>
            setSelectedShipmentIds((prev) =>
              prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
            )
          }
          inlineEntries={inlineShipments.map((s) => ({
            key: s.key,
            node: (
              <div className="text-xs space-y-0.5 pr-5">
                <div className="font-medium">{s.shipment_code}</div>
                <div className="text-muted-foreground">
                  {ports.find((p) => p.id === s.origin_port_id)?.name ?? "—"} →{" "}
                  {ports.find((p) => p.id === s.destination_port_id)?.name ?? "—"}
                </div>
              </div>
            ),
          }))}
          onRemoveInline={(key) =>
            setInlineShipments((prev) => prev.filter((s) => s.key !== key))
          }
          inlineCreateSlot={
            editingShipment ? (
              <div className="rounded-lg border border-dashed border-primary/30 p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    className="h-7 text-xs"
                    placeholder="Shipment code"
                    value={editingShipment.shipment_code}
                    onChange={(e) =>
                      setEditingShipment((s) => s && { ...s, shipment_code: e.target.value })
                    }
                  />
                  <SelectField
                    value={editingShipment.status}
                    onChange={(v) => setEditingShipment((s) => s && { ...s, status: v })}
                    options={[
                      { value: "planned", label: "Planned" },
                      { value: "in_transit", label: "In Transit" },
                      { value: "delayed", label: "Delayed" },
                      { value: "delivered", label: "Delivered" },
                      { value: "cancelled", label: "Cancelled" },
                    ]}
                    placeholder="Status"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <SelectField
                    value={editingShipment.origin_port_id}
                    onChange={(v) => setEditingShipment((s) => s && { ...s, origin_port_id: v })}
                    options={portOptions}
                    placeholder="Origin port"
                  />
                  <SelectField
                    value={editingShipment.destination_port_id}
                    onChange={(v) => setEditingShipment((s) => s && { ...s, destination_port_id: v })}
                    options={portOptions}
                    placeholder="Destination port"
                  />
                </div>
                <Input
                  type="date"
                  className="h-7 text-xs"
                  value={editingShipment.eta}
                  onChange={(e) =>
                    setEditingShipment((s) => s && { ...s, eta: e.target.value })
                  }
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setEditingShipment(null)}
                    className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (editingShipment.shipment_code) {
                        setInlineShipments((prev) => [...prev, editingShipment]);
                        setEditingShipment(null);
                      }
                    }}
                    className="text-[11px] text-primary font-medium hover:text-primary/80 cursor-pointer"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            ) : null
          }
          onAddInline={() => setEditingShipment(emptyInlineShipment())}
        />
      )}
    </WizardShell>
  );
}
