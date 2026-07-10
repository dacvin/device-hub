import { Server } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * DeviceHub wordmark — teal instrument tile + name. Matches the in-app sidebar
 * brand. Text color inherits, so it sits correctly on both the light canvas and
 * the deep-ink auth brand panel.
 */
export function AppWordmark({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <span className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-md">
        <Server className="size-4" />
      </span>
      <span className="text-base font-semibold tracking-tight">DeviceHub</span>
    </span>
  );
}
