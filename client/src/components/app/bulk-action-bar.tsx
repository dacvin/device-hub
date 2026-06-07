"use client";

export interface BulkActionBarProps {
  selectedCount: number;
  onClear: () => void;
  children: React.ReactNode;
  clearLabel?: string;
  countLabel: (n: number) => string;
}

export function BulkActionBar({ selectedCount, onClear, children, clearLabel = "Clear", countLabel }: BulkActionBarProps) {
  if (selectedCount === 0) return null;
  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 rounded-full border border-border bg-popover shadow-lg flex items-center gap-2 px-3 py-2"
      role="region"
      aria-label="Bulk actions"
    >
      <span className="px-2 text-sm font-medium">{countLabel(selectedCount)}</span>
      <div className="h-5 w-px bg-border" aria-hidden />
      {children}
      <div className="h-5 w-px bg-border" aria-hidden />
      <button
        type="button"
        className="text-xs text-muted-foreground hover:text-foreground px-2"
        onClick={onClear}
      >
        {clearLabel}
      </button>
    </div>
  );
}
