"use client";

import { useState, useCallback } from "react";
import {
    Package,
    Plus,
    CalendarDays,
    DollarSign,
    Boxes,
    Users,
    Ruler,
    Weight,
    Layers,
    Thermometer,
    Shield,
    Clock,
    CheckCircle2,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

// ── Form field component ─────────────────────────────────

function FormField({
    icon: Icon,
    label,
    required,
    children,
}: {
    icon: React.ElementType;
    label: string;
    required?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Icon className="h-3.5 w-3.5" />
                {label}
                {required && <span className="text-urgency-critical">*</span>}
            </label>
            {children}
        </div>
    );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            {children}
        </h4>
    );
}

// ── Add SKU Modal ────────────────────────────────────────

type AddSKUFormData = {
    skuCode: string;
    name: string;
    category: string;
    description: string;
    unitOfMeasure: string;
    quantityOnHand: string;
    unitCost: string;
    vendor: string;
    deliveryDate: string;
    leadTimeDays: string;
    dimensions: string;
    weight: string;
    material: string;
    operatingTemp: string;
    compliance: string;
};

const emptyForm: AddSKUFormData = {
    skuCode: "",
    name: "",
    category: "",
    description: "",
    unitOfMeasure: "unit",
    quantityOnHand: "",
    unitCost: "",
    vendor: "",
    deliveryDate: "",
    leadTimeDays: "",
    dimensions: "",
    weight: "",
    material: "",
    operatingTemp: "",
    compliance: "",
};

export function AddSKUModal({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [form, setForm] = useState<AddSKUFormData>(emptyForm);
    const [submitted, setSubmitted] = useState(false);

    const update = useCallback(
        (field: keyof AddSKUFormData, value: string) =>
            setForm((prev) => ({ ...prev, [field]: value })),
        []
    );

    const handleSubmit = () => {
        setSubmitted(true);
        setTimeout(() => {
            setSubmitted(false);
            setForm(emptyForm);
            onOpenChange(false);
        }, 1800);
    };

    const handleClose = (open: boolean) => {
        if (!open) {
            setForm(emptyForm);
            setSubmitted(false);
        }
        onOpenChange(open);
    };

    const inputClass =
        "h-8 text-sm bg-input/30 border-border/50 placeholder:text-muted-foreground/40 focus-visible:ring-primary/30";

    if (submitted) {
        return (
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="sm:max-w-md border-border/50 bg-card/95 backdrop-blur-xl">
                    <div className="flex flex-col items-center gap-4 py-8">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-urgency-safe/15 border border-urgency-safe/30">
                            <CheckCircle2 className="h-8 w-8 text-urgency-safe" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-semibold">SKU Added Successfully</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                <span className="font-mono">{form.skuCode || "NEW-SKU"}</span> —{" "}
                                {form.name || "Untitled"} has been added to your inventory.
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-2xl max-h-[85vh] p-0 overflow-hidden border-border/50 bg-card/95 backdrop-blur-xl">
                <ScrollArea className="max-h-[85vh]">
                    <div className="p-6 space-y-6">
                        {/* Header */}
                        <DialogHeader className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 border border-primary/30">
                                    <Plus className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <DialogTitle className="text-lg font-semibold">
                                        Add New SKU
                                    </DialogTitle>
                                    <DialogDescription>
                                        Manually register a new SKU with order and specification
                                        details.
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <Separator />

                        {/* Basic Information */}
                        <div>
                            <SectionLabel>Basic Information</SectionLabel>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField icon={Package} label="SKU Code" required>
                                    <Input
                                        className={inputClass}
                                        placeholder="e.g. SKU-601"
                                        value={form.skuCode}
                                        onChange={(e) => update("skuCode", e.target.value)}
                                    />
                                </FormField>
                                <FormField icon={Package} label="SKU Name" required>
                                    <Input
                                        className={inputClass}
                                        placeholder="e.g. Titanium Bolt Set"
                                        value={form.name}
                                        onChange={(e) => update("name", e.target.value)}
                                    />
                                </FormField>
                                <FormField icon={Layers} label="Category" required>
                                    <Input
                                        className={inputClass}
                                        placeholder="e.g. Hardware, Electronics"
                                        value={form.category}
                                        onChange={(e) => update("category", e.target.value)}
                                    />
                                </FormField>
                                <FormField icon={Package} label="Unit of Measure">
                                    <Input
                                        className={inputClass}
                                        placeholder="unit, set, kit, kg"
                                        value={form.unitOfMeasure}
                                        onChange={(e) => update("unitOfMeasure", e.target.value)}
                                    />
                                </FormField>
                            </div>
                            <div className="mt-4">
                                <FormField icon={Package} label="Description">
                                    <Input
                                        className={inputClass}
                                        placeholder="Brief description of the SKU"
                                        value={form.description}
                                        onChange={(e) => update("description", e.target.value)}
                                    />
                                </FormField>
                            </div>
                        </div>

                        <Separator />

                        {/* Order & Supply Details */}
                        <div>
                            <SectionLabel>Order &amp; Supply Details</SectionLabel>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField icon={Boxes} label="Quantity On Hand" required>
                                    <Input
                                        type="number"
                                        className={inputClass}
                                        placeholder="0"
                                        value={form.quantityOnHand}
                                        onChange={(e) => update("quantityOnHand", e.target.value)}
                                    />
                                </FormField>
                                <FormField icon={DollarSign} label="Unit Cost ($)" required>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        className={inputClass}
                                        placeholder="0.00"
                                        value={form.unitCost}
                                        onChange={(e) => update("unitCost", e.target.value)}
                                    />
                                </FormField>
                                <FormField icon={Users} label="Vendor / Supplier" required>
                                    <Input
                                        className={inputClass}
                                        placeholder="e.g. GlobalTech Electronics"
                                        value={form.vendor}
                                        onChange={(e) => update("vendor", e.target.value)}
                                    />
                                </FormField>
                                <FormField icon={CalendarDays} label="Expected Delivery Date">
                                    <Input
                                        type="date"
                                        className={inputClass}
                                        value={form.deliveryDate}
                                        onChange={(e) => update("deliveryDate", e.target.value)}
                                    />
                                </FormField>
                                <FormField icon={Clock} label="Lead Time (days)">
                                    <Input
                                        type="number"
                                        className={inputClass}
                                        placeholder="e.g. 30"
                                        value={form.leadTimeDays}
                                        onChange={(e) => update("leadTimeDays", e.target.value)}
                                    />
                                </FormField>
                            </div>
                        </div>

                        <Separator />

                        {/* Specifications */}
                        <div>
                            <SectionLabel>Specifications</SectionLabel>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField icon={Ruler} label="Dimensions">
                                    <Input
                                        className={inputClass}
                                        placeholder="e.g. 120 × 45 × 8 mm"
                                        value={form.dimensions}
                                        onChange={(e) => update("dimensions", e.target.value)}
                                    />
                                </FormField>
                                <FormField icon={Weight} label="Weight">
                                    <Input
                                        className={inputClass}
                                        placeholder="e.g. 38 g"
                                        value={form.weight}
                                        onChange={(e) => update("weight", e.target.value)}
                                    />
                                </FormField>
                                <FormField icon={Layers} label="Material">
                                    <Input
                                        className={inputClass}
                                        placeholder="e.g. Stainless Steel 304"
                                        value={form.material}
                                        onChange={(e) => update("material", e.target.value)}
                                    />
                                </FormField>
                                <FormField icon={Thermometer} label="Operating Temp">
                                    <Input
                                        className={inputClass}
                                        placeholder="e.g. -20 °C to 85 °C"
                                        value={form.operatingTemp}
                                        onChange={(e) => update("operatingTemp", e.target.value)}
                                    />
                                </FormField>
                            </div>
                            <div className="mt-4">
                                <FormField icon={Shield} label="Compliance / Certifications">
                                    <Input
                                        className={inputClass}
                                        placeholder="Comma-separated, e.g. RoHS, CE, UL Listed"
                                        value={form.compliance}
                                        onChange={(e) => update("compliance", e.target.value)}
                                    />
                                </FormField>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 border-t border-border/50 bg-card/95 backdrop-blur-xl px-6 py-4">
                        <DialogFooter className="sm:justify-between">
                            <p className="text-[11px] text-muted-foreground hidden sm:block">
                                Fields marked with{" "}
                                <span className="text-urgency-critical">*</span> are required
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleClose(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    className="gap-1.5"
                                    disabled={
                                        !form.skuCode ||
                                        !form.name ||
                                        !form.category ||
                                        !form.quantityOnHand ||
                                        !form.unitCost ||
                                        !form.vendor
                                    }
                                    onClick={handleSubmit}
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Add SKU
                                </Button>
                            </div>
                        </DialogFooter>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

// ── ERP Import Demo Modal ────────────────────────────────

const erpSources = [
    {
        name: "SAP S/4HANA MM",
        description: "Material Master + Purchase Orders",
        modules: ["Material Master (MM01)", "Purchase Orders (ME21N)", "Vendor Master (XK01)", "Stock Overview (MMBE)"],
        icon: "🏢",
        status: "available" as const,
    },
    {
        name: "SAP S/4HANA SD",
        description: "Sales & Distribution data",
        modules: ["Sales Orders (VA01)", "Delivery (VL01N)", "Billing (VF01)"],
        icon: "📦",
        status: "available" as const,
    },
    {
        name: "Oracle ERP Cloud",
        description: "Procurement & Inventory modules",
        modules: ["Item Master", "Purchase Orders", "Inventory Balances"],
        icon: "☁️",
        status: "coming-soon" as const,
    },
    {
        name: "Microsoft Dynamics 365",
        description: "Supply Chain Management",
        modules: ["Product Information", "Procurement", "Inventory Management"],
        icon: "🔷",
        status: "coming-soon" as const,
    },
];

export function ERPImportModal({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [selectedERP, setSelectedERP] = useState<string | null>(null);
    const [connecting, setConnecting] = useState(false);

    const handleConnect = () => {
        setConnecting(true);
        // Demo only — simulate a brief connection attempt then reset
        setTimeout(() => {
            setConnecting(false);
            setSelectedERP(null);
        }, 2500);
    };

    const handleClose = (open: boolean) => {
        if (!open) {
            setSelectedERP(null);
            setConnecting(false);
        }
        onOpenChange(open);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-xl max-h-[85vh] p-0 overflow-hidden border-border/50 bg-card/95 backdrop-blur-xl">
                <ScrollArea className="max-h-[85vh]">
                    <div className="p-6 space-y-6">
                        {/* Header */}
                        <DialogHeader className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 border border-primary/30 text-lg">
                                    🔗
                                </div>
                                <div>
                                    <DialogTitle className="text-lg font-semibold">
                                        Import from ERP
                                    </DialogTitle>
                                    <DialogDescription>
                                        Connect to your enterprise system to import SKUs, purchase
                                        orders, and master data.
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <Separator />

                        {/* ERP Source Selection */}
                        <div>
                            <SectionLabel>Select ERP Source</SectionLabel>
                            <div className="space-y-2">
                                {erpSources.map((erp) => {
                                    const isSelected = selectedERP === erp.name;
                                    const isAvailable = erp.status === "available";
                                    return (
                                        <button
                                            key={erp.name}
                                            onClick={() =>
                                                isAvailable && setSelectedERP(isSelected ? null : erp.name)
                                            }
                                            disabled={!isAvailable}
                                            className={`w-full text-left rounded-lg border p-4 transition-all duration-200 ${isSelected
                                                    ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                                                    : isAvailable
                                                        ? "border-border/50 bg-muted/10 hover:bg-accent/20 hover:border-border cursor-pointer"
                                                        : "border-border/30 bg-muted/5 opacity-60 cursor-not-allowed"
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <span className="text-2xl mt-0.5">{erp.icon}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium">
                                                            {erp.name}
                                                        </span>
                                                        {!isAvailable && (
                                                            <Badge
                                                                variant="outline"
                                                                className="text-[10px] bg-muted/30 text-muted-foreground"
                                                            >
                                                                Coming Soon
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                                        {erp.description}
                                                    </p>
                                                    {isSelected && (
                                                        <div className="mt-3 space-y-2">
                                                            <p className="text-[11px] font-medium text-muted-foreground">
                                                                Available modules:
                                                            </p>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {erp.modules.map((mod) => (
                                                                    <Badge
                                                                        key={mod}
                                                                        variant="outline"
                                                                        className="text-[10px] bg-primary/5 text-primary border-primary/20"
                                                                    >
                                                                        {mod}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                {isAvailable && (
                                                    <div
                                                        className={`mt-1 h-4 w-4 rounded-full border-2 transition-all ${isSelected
                                                                ? "border-primary bg-primary"
                                                                : "border-border/80"
                                                            }`}
                                                    >
                                                        {isSelected && (
                                                            <div className="h-full w-full flex items-center justify-center">
                                                                <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Connection Settings (shown when SAP selected) */}
                        {selectedERP && (
                            <>
                                <Separator />
                                <div>
                                    <SectionLabel>Connection Settings</SectionLabel>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-muted-foreground">
                                                Host / Server URL
                                            </label>
                                            <Input
                                                className="h-8 text-sm bg-input/30 border-border/50 placeholder:text-muted-foreground/40"
                                                placeholder="e.g. sap-prod.company.com"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-muted-foreground">
                                                Client ID
                                            </label>
                                            <Input
                                                className="h-8 text-sm bg-input/30 border-border/50 placeholder:text-muted-foreground/40"
                                                placeholder="e.g. 100"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-muted-foreground">
                                                Username
                                            </label>
                                            <Input
                                                className="h-8 text-sm bg-input/30 border-border/50 placeholder:text-muted-foreground/40"
                                                placeholder="SAP User ID"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-muted-foreground">
                                                Password
                                            </label>
                                            <Input
                                                type="password"
                                                className="h-8 text-sm bg-input/30 border-border/50 placeholder:text-muted-foreground/40"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 border-t border-border/50 bg-card/95 backdrop-blur-xl px-6 py-4">
                        <DialogFooter className="sm:justify-between">
                            <Badge variant="outline" className="text-[10px] bg-urgency-warning/10 text-urgency-warning border-urgency-warning/20 hidden sm:flex">
                                Demo Only — No data will be imported
                            </Badge>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleClose(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    className="gap-1.5"
                                    disabled={!selectedERP || connecting}
                                    onClick={handleConnect}
                                >
                                    {connecting ? (
                                        <>
                                            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                            Connecting…
                                        </>
                                    ) : (
                                        <>
                                            🔗 Connect & Import
                                        </>
                                    )}
                                </Button>
                            </div>
                        </DialogFooter>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
