"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Plus, X, ChevronDown, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ── Step Indicator ───────────────────────────────────────

export function StepIndicator({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {steps.map((label, i) => {
        const isDone = i < current;
        const isActive = i === current;
        return (
          <React.Fragment key={label}>
            {i > 0 && (
              <div
                className={cn(
                  "flex-1 h-px transition-colors duration-300",
                  isDone ? "bg-primary" : "bg-border"
                )}
              />
            )}
            <div className="flex items-center gap-1.5">
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-300",
                  isDone
                    ? "bg-primary text-primary-foreground"
                    : isActive
                      ? "bg-primary/20 text-primary ring-2 ring-primary/40"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {isDone ? <Check className="h-3 w-3" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-[11px] font-medium transition-colors hidden sm:inline",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Import Section ───────────────────────────────────────

export function ImportSection() {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/60 bg-muted/20 px-4 py-3 text-xs text-muted-foreground hover:bg-muted/40 hover:border-primary/40 transition-all cursor-pointer"
      >
        <Upload className="h-4 w-4" />
        Import from file (CSV / Excel)
      </button>
      <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" />

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-border/60" />
        <span className="text-[11px] text-muted-foreground/60 italic">
          or enter details below
        </span>
        <div className="flex-1 h-px bg-border/60" />
      </div>
    </div>
  );
}

// ── Form Field ───────────────────────────────────────────

export function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-foreground/80">
        {label}
        {required && <span className="text-primary ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

// ── Select Dropdown ──────────────────────────────────────

export function SelectField({
  value,
  onChange,
  options,
  placeholder = "Select…",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full appearance-none rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30 cursor-pointer"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
    </div>
  );
}

// ── Entity Picker / Inline Create ────────────────────────

export interface PickerItem {
  id: string;
  label: string;
  sub?: string;
}

export function EntityPickerOrCreate({
  entityLabel,
  existingItems,
  selectedIds,
  onToggleId,
  inlineCreateSlot,
  onAddInline,
  inlineEntries,
  onRemoveInline,
}: {
  entityLabel: string;
  existingItems: PickerItem[];
  selectedIds: string[];
  onToggleId: (id: string) => void;
  inlineCreateSlot?: React.ReactNode;
  onAddInline?: () => void;
  inlineEntries?: { key: string; node: React.ReactNode }[];
  onRemoveInline?: (key: string) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = existingItems.filter(
    (i) =>
      i.label.toLowerCase().includes(search.toLowerCase()) ||
      (i.sub && i.sub.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      {/* Search existing */}
      <div>
        <label className="text-xs font-medium text-foreground/80 mb-1.5 block">
          Select existing {entityLabel}
        </label>
        <Input
          placeholder={`Search ${entityLabel}…`}
          className="h-8 text-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="mt-2 max-h-36 overflow-y-auto space-y-1 rounded-md border border-border/50 p-1">
          {filtered.length === 0 && (
            <div className="py-3 text-center text-[11px] text-muted-foreground">
              No {entityLabel} found
            </div>
          )}
          {filtered.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onToggleId(item.id)}
                className={cn(
                  "w-full flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs transition-colors cursor-pointer",
                  isSelected
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-accent/50 text-foreground"
                )}
              >
                <div
                  className={cn(
                    "h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                    isSelected
                      ? "bg-primary border-primary"
                      : "border-border"
                  )}
                >
                  {isSelected && (
                    <Check className="h-2.5 w-2.5 text-primary-foreground" />
                  )}
                </div>
                <span className="truncate font-medium">{item.label}</span>
                {item.sub && (
                  <span className="text-muted-foreground ml-auto text-[10px] truncate">
                    {item.sub}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Inline created entries */}
      {inlineEntries && inlineEntries.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-medium text-foreground/80">
            New {entityLabel} to create
          </span>
          {inlineEntries.map((entry) => (
            <div
              key={entry.key}
              className="relative rounded-lg border border-primary/20 bg-primary/5 p-3"
            >
              <button
                type="button"
                onClick={() => onRemoveInline?.(entry.key)}
                className="absolute top-2 right-2 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              {entry.node}
            </div>
          ))}
        </div>
      )}

      {/* Inline create slot (current open form) */}
      {inlineCreateSlot}

      {/* Add new inline button */}
      {onAddInline && (
        <button
          type="button"
          onClick={onAddInline}
          className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          Add new {entityLabel}
        </button>
      )}
    </div>
  );
}

// ── Pair Picker (for Shipment → SKU & Supplier) ─────────

export function PairPicker({
  pairs,
  onAddPair,
  onRemovePair,
  onUpdatePair,
  skuItems,
  supplierItems,
}: {
  pairs: { key: string; skuId: string; supplierId: string }[];
  onAddPair: () => void;
  onRemovePair: (key: string) => void;
  onUpdatePair: (key: string, field: "skuId" | "supplierId", value: string) => void;
  skuItems: PickerItem[];
  supplierItems: PickerItem[];
}) {
  return (
    <div className="space-y-3">
      <label className="text-xs font-medium text-foreground/80">
        SKU & Supplier pairs for this shipment
      </label>
      {pairs.map((pair) => (
        <div
          key={pair.key}
          className="flex items-start gap-2 rounded-lg border border-border/50 bg-card/50 p-3"
        >
          <div className="flex-1 space-y-2">
            <SelectField
              value={pair.skuId}
              onChange={(v) => onUpdatePair(pair.key, "skuId", v)}
              options={skuItems.map((s) => ({ value: s.id, label: s.label }))}
              placeholder="Select SKU…"
            />
            <SelectField
              value={pair.supplierId}
              onChange={(v) => onUpdatePair(pair.key, "supplierId", v)}
              options={supplierItems.map((s) => ({
                value: s.id,
                label: s.label,
              }))}
              placeholder="Select Supplier…"
            />
          </div>
          <button
            type="button"
            onClick={() => onRemovePair(pair.key)}
            className="mt-1 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={onAddPair}
        className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors cursor-pointer"
      >
        <Plus className="h-3.5 w-3.5" />
        Add pair
      </button>
    </div>
  );
}

// ── Wizard Shell ─────────────────────────────────────────

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
};

export function WizardShell({
  open,
  onOpenChange,
  title,
  description,
  steps,
  currentStep,
  direction,
  onBack,
  onNext,
  onSubmit,
  isSubmitting,
  canAdvance,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  steps: string[];
  currentStep: number;
  direction: number;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  canAdvance: boolean;
  children: React.ReactNode;
}) {
  const isLast = currentStep === steps.length - 1;
  const isFirst = currentStep === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <StepIndicator steps={steps} current={currentStep} />

        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 pr-1">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border/50 mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            disabled={isFirst}
            className={cn(isFirst && "invisible")}
          >
            Back
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            {isLast ? (
              <Button
                size="sm"
                onClick={onSubmit}
                disabled={isSubmitting || !canAdvance}
              >
                {isSubmitting ? "Creating…" : "Create"}
              </Button>
            ) : (
              <Button size="sm" onClick={onNext} disabled={!canAdvance}>
                Next
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
