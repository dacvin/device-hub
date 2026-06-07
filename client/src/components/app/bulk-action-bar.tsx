"use client";

import { X } from "lucide-react";

export interface BulkActionBarProps {
  selectedCount: number;
  onClear: () => void;
  children: React.ReactNode;
  countLabel: (n: number) => string;
}

export function BulkActionBar({ selectedCount, onClear, children, countLabel }: BulkActionBarProps) {
  if (selectedCount === 0) return null;
  return (
    <div
      className="fixed bottom-[18px] left-1/2 -translate-x-1/2 z-40 rounded-full border border-border bg-popover shadow-[0_8px_30px_rgba(16,24,40,0.18)] flex items-center gap-3 pl-[18px] pr-2 py-[7px]"
      role="region"
      aria-label="Bulk actions"
    >
      <span className="text-[13px] text-muted-foreground whitespace-nowrap font-[500]">
        {countLabel(selectedCount)}
      </span>
      <div className="w-px h-[22px] bg-border shrink-0" aria-hidden />
      <div className="flex items-center gap-1.5">
        {children}
      </div>
      <button
        type="button"
        aria-label="Clear selection"
        className="size-[30px] rounded-full flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        onClick={onClear}
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}
