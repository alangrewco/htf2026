"use client";

import { useState, useEffect } from "react";
import { useReferenceData } from "@/lib/api/reference/use-reference-data";
import { EntityPickerOrCreate } from "@/components/create-modal-shared";
import { Button } from "@/components/ui/button";
import { useCreateIngestionRun } from "@/sdk/ingestion/ingestion";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

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
  const [preSelectedSkuIds, setPreSelectedSkuIds] = useState<string[]>([]);
  const [preSelectedSupplierIds, setPreSelectedSupplierIds] = useState<string[]>([]);
  const [preSelectedShipmentIds, setPreSelectedShipmentIds] = useState<string[]>([]);
  const [frequency, setFrequency] = useState("once");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Auto-select newly created items that likely haven't been analyzed
  useEffect(() => {
    if (selectedIdsFromQuery) {
      setIsOpen(true);
      const unanalyzedSkus = skus.filter((s) => s.risk_score === -1).map((s) => s.id);
      const unanalyzedSuppliers = suppliers.filter((s) => s.risk_rating === "new" || s.risk_rating === "").map((s) => s.id);
      const unanalyzedShipments: string[] = [];

      // Only set if we haven't already selected something
      if (selectedSkuIds.length === 0) {
        setSelectedSkuIds(unanalyzedSkus);
        setPreSelectedSkuIds(unanalyzedSkus);
      }
      if (selectedSupplierIds.length === 0) {
        setSelectedSupplierIds(unanalyzedSuppliers);
        setPreSelectedSupplierIds(unanalyzedSuppliers);
      }
      if (selectedShipmentIds.length === 0) {
        setSelectedShipmentIds(unanalyzedShipments);
        setPreSelectedShipmentIds(unanalyzedShipments);
      }
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
      const res = await createRun.trigger({ max_articles: 20 });
      if (res.status === 202) {
        toast.success("Analysis started successfully", {
          description: `Job ID: ${res.data.run_id} has been queued.`,
        });
        mutate((key: unknown) => typeof key === "string", undefined, { revalidate: true });
        
        // Reset form
        setSelectedSkuIds([]);
        setSelectedSupplierIds([]);
        setSelectedShipmentIds([]);
        setIsOpen(false);
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="mb-8 gap-2">
          <Plus className="h-4 w-4" /> Start New Analysis
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>Start New Analysis</DialogTitle>
          <DialogDescription>
            Select the entities you want to analyze for real-time risk intelligence.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Select SKUs</h3>
            <EntityPickerOrCreate
              entityLabel="SKUs"
              existingItems={skus
                .slice()
                .sort((a, b) => {
                  const aPre = preSelectedSkuIds.includes(a.id);
                  const bPre = preSelectedSkuIds.includes(b.id);
                  if (aPre && !bPre) return -1;
                  if (!aPre && bPre) return 1;
                  return 0;
                })
                .map((s) => ({
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
              existingItems={suppliers
                .slice()
                .sort((a, b) => {
                  const aPre = preSelectedSupplierIds.includes(a.id);
                  const bPre = preSelectedSupplierIds.includes(b.id);
                  if (aPre && !bPre) return -1;
                  if (!aPre && bPre) return 1;
                  return 0;
                })
                .map((s) => ({
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
              existingItems={shipments
                .slice()
                .sort((a, b) => {
                  const aPre = preSelectedShipmentIds.includes(a.id);
                  const bPre = preSelectedShipmentIds.includes(b.id);
                  if (aPre && !bPre) return -1;
                  if (!aPre && bPre) return 1;
                  return 0;
                })
                .map((s) => ({
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

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 pt-4 border-t gap-4">
          <div className="flex items-center gap-3">
            <label htmlFor="frequency" className="text-sm font-medium whitespace-nowrap">
              Run frequency:
            </label>
            <select
              id="frequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="flex h-9 w-[180px] items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="once">Standard (Once)</option>
              <option value="hourly">Hourly Monitor</option>
              <option value="daily">Daily Briefing</option>
              <option value="weekly">Weekly Digest</option>
            </select>
          </div>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Starting..." : "Start Gathering Intel"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
