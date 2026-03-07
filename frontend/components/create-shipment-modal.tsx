"use client";

import { useState, useCallback } from "react";
import {
  WizardShell,
  ImportSection,
  FormField,
  SelectField,
  PairPicker,
  type PickerItem,
} from "@/components/create-modal-shared";
import { Input } from "@/components/ui/input";
import { useReferenceData } from "@/lib/api/reference/use-reference-data";
import { useCreateShipment } from "@/sdk/reference/reference";
import type { CreateShipmentRequest } from "@/sdk/model";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const STEPS = ["Shipment Details", "SKU & Supplier Pairs"];

// ── Main Component ───────────────────────────────────────

export function CreateShipmentModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { skus, suppliers, ports } = useReferenceData();
  const createShipment = useCreateShipment();
  const { mutate } = useSWRConfig();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  // Step 1: Shipment details
  const [form, setForm] = useState({
    shipment_code: "",
    status: "planned" as CreateShipmentRequest["status"],
    origin_port_id: "",
    destination_port_id: "",
    carrier: "",
    order_date: "",
    expected_delivery_date: "",
  });

  // Step 2: SKU/Supplier pairs
  const [pairs, setPairs] = useState<
    { key: string; skuId: string; supplierId: string }[]
  >([{ key: crypto.randomUUID(), skuId: "", supplierId: "" }]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const reset = useCallback(() => {
    setStep(0);
    setDirection(1);
    setForm({ shipment_code: "", status: "planned", origin_port_id: "", destination_port_id: "", carrier: "", order_date: "", expected_delivery_date: "" });
    setPairs([{ key: crypto.randomUUID(), skuId: "", supplierId: "" }]);
  }, []);

  const handleOpenChange = useCallback(
    (o: boolean) => { if (!o) reset(); onOpenChange(o); },
    [onOpenChange, reset]
  );

  const goNext = () => { setDirection(1); setStep((s) => Math.min(s + 1, STEPS.length - 1)); };
  const goBack = () => { setDirection(-1); setStep((s) => Math.max(s - 1, 0)); };

  const canAdvance =
    step === 0
      ? Boolean(form.shipment_code && form.origin_port_id && form.destination_port_id)
      : pairs.some((p) => p.skuId && p.supplierId);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Collect all valid pairs grouped by supplier
      const validPairs = pairs.filter((p) => p.skuId && p.supplierId);

      // Group by supplierId — the API takes a single supplier_id per shipment
      const bySupplier = new Map<string, string[]>();
      for (const p of validPairs) {
        const existing = bySupplier.get(p.supplierId);
        if (existing) existing.push(p.skuId);
        else bySupplier.set(p.supplierId, [p.skuId]);
      }

      // Create one shipment per unique supplier (API constraint: single supplier_id)
      for (const [supplierId, skuIds] of bySupplier) {
        await createShipment.trigger({
          shipment_code: form.shipment_code + (bySupplier.size > 1 ? `-${supplierId.slice(-4)}` : ""),
          status: form.status,
          origin_port_id: form.origin_port_id,
          destination_port_id: form.destination_port_id,
          route_id: "",
          supplier_id: supplierId,
          sku_ids: [...new Set(skuIds)],
          carrier: form.carrier,
          order_date: form.order_date ? new Date(form.order_date).toISOString() : new Date().toISOString(),
          expected_delivery_date: form.expected_delivery_date ? new Date(form.expected_delivery_date).toISOString() : new Date().toISOString(),
          events: [],
        });
      }

      mutate((key: unknown) => typeof key === "string", undefined, { revalidate: true });
      handleOpenChange(false);

      toast.success("Shipment Created Successfully", {
        description: "New item is ready for analysis and monitoring.",
        action: {
          label: "Start Analysis",
          onClick: () => router.push("/jobs?openModal=true")
        }
      });

    } catch (err) {
      console.error("Failed to create shipment:", err);
      toast.error("Error creating shipment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const portOptions = ports.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  const skuPickerItems: PickerItem[] = skus.map((s) => ({
    id: s.id,
    label: s.name,
    sub: s.sku_code,
  }));

  const supplierPickerItems: PickerItem[] = suppliers.map((s) => ({
    id: s.id,
    label: s.name,
    sub: s.supplier_code,
  }));

  return (
    <WizardShell
      open={open}
      onOpenChange={handleOpenChange}
      title="New Shipment"
      description="Create a new shipment and assign SKU & supplier pairs."
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
          <FormField label="Shipment Code" required>
            <Input
              className="h-8 text-xs"
              placeholder="e.g. SHIP-001"
              value={form.shipment_code}
              onChange={(e) => setForm((f) => ({ ...f, shipment_code: e.target.value }))}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Origin Port" required>
              <SelectField
                value={form.origin_port_id}
                onChange={(v) => setForm((f) => ({ ...f, origin_port_id: v }))}
                options={portOptions}
                placeholder="Select origin…"
              />
            </FormField>
            <FormField label="Destination Port" required>
              <SelectField
                value={form.destination_port_id}
                onChange={(v) => setForm((f) => ({ ...f, destination_port_id: v }))}
                options={portOptions}
                placeholder="Select destination…"
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Status">
              <SelectField
                value={form.status}
                onChange={(v) => setForm((f) => ({ ...f, status: v as CreateShipmentRequest["status"] }))}
                options={[
                  { value: "planned", label: "Planned" },
                  { value: "in_transit", label: "In Transit" },
                  { value: "delayed", label: "Delayed" },
                  { value: "delivered", label: "Delivered" },
                  { value: "cancelled", label: "Cancelled" },
                ]}
              />
            </FormField>
            <FormField label="Carrier">
              <Input
                className="h-8 text-xs"
                placeholder="e.g. Maersk"
                value={form.carrier}
                onChange={(e) => setForm((f) => ({ ...f, carrier: e.target.value }))}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Order Date">
              <Input
                type="date"
                className="h-8 text-xs"
                value={form.order_date}
                onChange={(e) => setForm((f) => ({ ...f, order_date: e.target.value }))}
              />
            </FormField>
            <FormField label="Expected Delivery Date">
              <Input
                type="date"
                className="h-8 text-xs"
                value={form.expected_delivery_date}
                onChange={(e) => setForm((f) => ({ ...f, expected_delivery_date: e.target.value }))}
              />
            </FormField>
          </div>
        </div>
      )}

      {step === 1 && (
        <PairPicker
          pairs={pairs}
          onAddPair={() =>
            setPairs((prev) => [
              ...prev,
              { key: crypto.randomUUID(), skuId: "", supplierId: "" },
            ])
          }
          onRemovePair={(key) =>
            setPairs((prev) => prev.filter((p) => p.key !== key))
          }
          onUpdatePair={(key, field, value) =>
            setPairs((prev) =>
              prev.map((p) => (p.key === key ? { ...p, [field]: value } : p))
            )
          }
          skuItems={skuPickerItems}
          supplierItems={supplierPickerItems}
        />
      )}
    </WizardShell>
  );
}
