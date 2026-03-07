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
import { useCreateSupplier, useCreateSku } from "@/sdk/reference/reference";
import { MasterStatus, SkuRiskLevel } from "@/sdk/model";
import type { CreateSupplierRequest } from "@/sdk/model";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const STEPS = ["Supplier Details", "SKUs"];

// ── Inline SKU ───────────────────────────────────────────

interface InlineSku {
  key: string;
  sku_code: string;
  name: string;
  description: string;
  unit_of_measure: string;
}

function emptyInlineSku(): InlineSku {
  return {
    key: crypto.randomUUID(),
    sku_code: "",
    name: "",
    description: "",
    unit_of_measure: "",
  };
}

// ── Main Component ───────────────────────────────────────

export function CreateSupplierModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { skus } = useReferenceData();
  const createSupplier = useCreateSupplier();
  const createSku = useCreateSku();
  const { mutate } = useSWRConfig();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  // Step 1: Supplier details
  const [form, setForm] = useState<CreateSupplierRequest>({
    supplier_code: "",
    name: "",
    country: "",
    contact_email: "",
    status: MasterStatus.active,
    region: "",
    risk_rating: "",
  });

  // Step 2: SKUs
  const [selectedSkuIds, setSelectedSkuIds] = useState<string[]>([]);
  const [inlineSkus, setInlineSkus] = useState<InlineSku[]>([]);
  const [editingSku, setEditingSku] = useState<InlineSku | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const reset = useCallback(() => {
    setStep(0);
    setDirection(1);
    setForm({ supplier_code: "", name: "", country: "", contact_email: "", status: MasterStatus.active, region: "", risk_rating: "" });
    setSelectedSkuIds([]);
    setInlineSkus([]);
    setEditingSku(null);
  }, []);

  const handleOpenChange = useCallback(
    (o: boolean) => { if (!o) reset(); onOpenChange(o); },
    [onOpenChange, reset]
  );

  const goNext = () => {
    if (step === 1 && editingSku && editingSku.name) {
      setInlineSkus((prev) => [...prev, editingSku]);
      setEditingSku(null);
    }
    setDirection(1);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const goBack = () => { setDirection(-1); setStep((s) => Math.max(s - 1, 0)); };

  const canAdvance = step === 0 ? Boolean(form.supplier_code && form.name) : true;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // 1. Create supplier
      const res = await createSupplier.trigger(form);
      if (res.status !== 201) throw new Error("Failed to create supplier");

      // 2. Create inline SKUs
      for (const s of inlineSkus) {
        await createSku.trigger({
          sku_code: s.sku_code,
          name: s.name,
          description: s.description,
          unit_of_measure: s.unit_of_measure,
          status: MasterStatus.active,
          risk_score: 0,
          risk_level: SkuRiskLevel.low,
          category: "",
          supplier_ids: res.data?.id ? [res.data.id] : [],
        });
      }

      // TODO: No API to link existing SKUs directly to this supplier.
      // The association is through shipments. Selected existing SKU IDs are noted
      // but cannot be linked without creating a shipment.

      mutate((key: unknown) => typeof key === "string", undefined, { revalidate: true });
      handleOpenChange(false);

      toast.success("Supplier Created Successfully", {
        description: "New item is ready for analysis and monitoring.",
        action: {
          label: "Start Analysis",
          onClick: () => router.push("/jobs?openModal=true")
        }
      });

    } catch (err) {
      console.error("Failed to create supplier:", err);
      toast.error("Error creating supplier");
    } finally {
      setIsSubmitting(false);
    }
  };

  const skuPickerItems: PickerItem[] = skus.map((s) => ({
    id: s.id,
    label: s.name,
    sub: s.sku_code,
  }));

  return (
    <WizardShell
      open={open}
      onOpenChange={handleOpenChange}
      title="New Supplier"
      description="Create a new supplier and optionally link SKUs."
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
            <FormField label="Supplier Code" required>
              <Input
                className="h-8 text-xs"
                placeholder="e.g. SUP-001"
                value={form.supplier_code}
                onChange={(e) => setForm((f) => ({ ...f, supplier_code: e.target.value }))}
              />
            </FormField>
            <FormField label="Name" required>
              <Input
                className="h-8 text-xs"
                placeholder="Supplier name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Country">
              <Input
                className="h-8 text-xs"
                placeholder="e.g. China"
                value={form.country}
                onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
              />
            </FormField>
            <FormField label="Contact Email">
              <Input
                className="h-8 text-xs"
                placeholder="email@supplier.com"
                value={form.contact_email}
                onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Status">
              <SelectField
                value={form.status}
                onChange={(v) => setForm((f) => ({ ...f, status: v as CreateSupplierRequest["status"] }))}
                options={[
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ]}
              />
            </FormField>
            <FormField label="Risk Rating">
              <SelectField
                value={form.risk_rating}
                onChange={(v) => setForm((f) => ({ ...f, risk_rating: v }))}
                options={[
                  { value: "low", label: "Low" },
                  { value: "medium", label: "Medium" },
                  { value: "high", label: "High" },
                  { value: "critical", label: "Critical" },
                ]}
                placeholder="Select rating…"
              />
            </FormField>
          </div>
          <FormField label="Region">
            <Input
              className="h-8 text-xs"
              placeholder="e.g. Asia Pacific"
              value={form.region}
              onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
            />
          </FormField>
        </div>
      )}

      {step === 1 && (
        <EntityPickerOrCreate
          entityLabel="SKUs"
          existingItems={skuPickerItems}
          selectedIds={selectedSkuIds}
          onToggleId={(id) =>
            setSelectedSkuIds((prev) =>
              prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
            )
          }
          inlineEntries={inlineSkus.map((s) => ({
            key: s.key,
            node: (
              <div className="text-xs space-y-0.5 pr-5">
                <div className="font-medium">{s.name}</div>
                <div className="text-muted-foreground">{s.sku_code}</div>
              </div>
            ),
          }))}
          onRemoveInline={(key) =>
            setInlineSkus((prev) => prev.filter((s) => s.key !== key))
          }
          inlineCreateSlot={
            editingSku ? (
              <div className="rounded-lg border border-dashed border-primary/30 p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    className="h-7 text-xs"
                    placeholder="SKU code"
                    value={editingSku.sku_code}
                    onChange={(e) => setEditingSku((s) => s && { ...s, sku_code: e.target.value })}
                  />
                  <Input
                    className="h-7 text-xs"
                    placeholder="Name"
                    value={editingSku.name}
                    onChange={(e) => setEditingSku((s) => s && { ...s, name: e.target.value })}
                  />
                </div>
                <Input
                  className="h-7 text-xs"
                  placeholder="Description"
                  value={editingSku.description}
                  onChange={(e) => setEditingSku((s) => s && { ...s, description: e.target.value })}
                />
                <Input
                  className="h-7 text-xs"
                  placeholder="Unit of measure"
                  value={editingSku.unit_of_measure}
                  onChange={(e) => setEditingSku((s) => s && { ...s, unit_of_measure: e.target.value })}
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setEditingSku(null)}
                    className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (editingSku.name) {
                        setInlineSkus((prev) => [...prev, editingSku]);
                        setEditingSku(null);
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
          onAddInline={() => setEditingSku(emptyInlineSku())}
        />
      )}
    </WizardShell>
  );
}
