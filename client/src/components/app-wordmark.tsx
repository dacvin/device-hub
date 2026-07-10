import { cn } from '@/lib/utils';

// Custom hub-and-nodes mark: a central hub linked to device nodes. Matches
// app/icon.svg. Uses currentColor so it inherits the tile's foreground.
export function HubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={className}>
      <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <line x1="16" y1="16" x2="16" y2="8.5" />
        <line x1="16" y1="16" x2="9.5" y2="22" />
        <line x1="16" y1="16" x2="22.5" y2="22" />
      </g>
      <g fill="currentColor">
        <circle cx="16" cy="16" r="3.3" />
        <circle cx="16" cy="8.5" r="2.3" />
        <circle cx="9.5" cy="22" r="2.3" />
        <circle cx="22.5" cy="22" r="2.3" />
      </g>
    </svg>
  );
}

/**
 * DeviceHub wordmark — teal instrument tile + name. Matches the in-app sidebar
 * brand. Text color inherits, so it sits correctly on both the light canvas and
 * the deep-ink auth brand panel.
 */
export function AppWordmark({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <span className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-md">
        <HubMark className="size-5" />
      </span>
      <span className="text-base font-semibold tracking-tight">DeviceHub</span>
    </span>
  );
}
