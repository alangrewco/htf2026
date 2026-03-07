"use client";

import { useState, useEffect } from "react";
import { useReferenceData } from "@/lib/api/reference/use-reference-data";
import { EntityPickerOrCreate } from "@/components/create-modal-shared";
import { Button } from "@/components/ui/button";
import { useCreateIngestionRun } from "@/sdk/ingestion/ingestion";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function StartAnalysisForm({
  selectedIdsFromQuery
}: {
  selectedIdsFromQuery?: boolean;
}) {
  const { skus, suppliers, shipments } = useReferenceData();
  const createRun = useCreateIngestionRun();
  const { mutate } = useSWRConfig();

  const [selectedSkuIds, setSelectedSkuIds] = useState<string[]>([]);
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);
  const [selectedShipmentIds, setSelectedShipmentIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Auto-select newly created items that likely haven't been analyzed
  useEffect(() => {
    if (selectedIdsFromQuery) {
      setIsOpen(true);
      console.log(skus)
      const unanalyzedSkus = skus.filter((s) => s.risk_score === -1).map((s) => s.id);
      const unanalyzedSuppliers = suppliers.filter((s) => s.risk_rating === "new" || s.risk_rating === "").map((s) => s.id);
      // const unanalyzedShipments = shipments.filter((s) => !s.events || s.events.length === 0).map((s) => s.id);
      const unanalyzedShipments: string[] = [];

      // Only set if we haven't already selected something
      if (selectedSkuIds.length === 0) setSelectedSkuIds(unanalyzedSkus);
      if (selectedSupplierIds.length === 0) setSelectedSupplierIds(unanalyzedSuppliers);
      if (selectedShipmentIds.length === 0) setSelectedShipmentIds(unanalyzedShipments);
    }
  }, [
    selectedIdsFromQuery,
    skus,
    suppliers,
    shipments,
    selectedSkuIds.length,
    selectedSupplierIds.length,
    selectedShipmentIds.length,
  ]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Dummy submission. Request model only takes max_articles currently.
      const res = await createRun.trigger({ max_articles: 100 });
      if (res.status === 202) {
        toast.success("Analysis started successfully", {
          description: `Job ID: ${res.data.run_id} has been queued.`,
        });
        mutate((key: unknown) => typeof key === "string", undefined, { revalidate: true });
        
        // Reset form
        setSelectedSkuIds([]);
        setSelectedSupplierIds([]);
        setSelectedShipmentIds([]);
      } else {
        throw new Error("Failed to start analysis");
      }
    } catch (error) {
      toast.error("Failed to start analysis", {
        description: "An error occurred while communicating with the server.",
      });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Accordion
      type="single"
      collapsible
      value={isOpen ? "form" : ""}
      onValueChange={(val) => setIsOpen(val === "form")}
      className="mb-8"
    >
      <AccordionItem value="form" className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <AccordionTrigger className="px-6 py-4 hover:no-underline rounded-lg [&[data-state=open]]:border-b [&[data-state=open]]:rounded-b-none transition-none">
          <div className="flex flex-col items-start gap-1.5 text-left">
            <h3 className="text-lg font-semibold leading-none tracking-tight">Start New Analysis</h3>
            <p className="text-sm text-muted-foreground font-normal">
              Select the entities you want to analyze for real-time risk intelligence.
            </p>
          </div>
        </AccordionTrigger>

        <AccordionContent className="pt-0 pb-0">
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Select SKUs</h3>
            <EntityPickerOrCreate
              entityLabel="SKUs"
              existingItems={skus.map((s) => ({
                id: s.id,
                label: s.name,
                sub: s.sku_code,
              }))}
              selectedIds={selectedSkuIds}
              onToggleId={(id) =>
                setSelectedSkuIds((prev) =>
                  prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                )
              }
            />
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium">Select Suppliers</h3>
            <EntityPickerOrCreate
              entityLabel="Suppliers"
              existingItems={suppliers.map((s) => ({
                id: s.id,
                label: s.name,
                sub: s.supplier_code,
              }))}
              selectedIds={selectedSupplierIds}
              onToggleId={(id) =>
                setSelectedSupplierIds((prev) =>
                  prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                )
              }
            />
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium">Select Shipments</h3>
            <EntityPickerOrCreate
              entityLabel="Shipments"
              existingItems={shipments.map((s) => ({
                id: s.id,
                label: s.shipment_code,
                sub: s.status,
              }))}
              selectedIds={selectedShipmentIds}
              onToggleId={(id) =>
                setSelectedShipmentIds((prev) =>
                  prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                )
              }
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end border-t border-border/50 px-6 py-4 bg-muted/20 rounded-b-lg">
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Starting..." : "Start Gathering Intel"}
        </Button>
      </div>
      </AccordionContent>
    </AccordionItem>
    </Accordion>
  );
}
