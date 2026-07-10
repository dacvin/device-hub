import { cn } from '@/lib/utils';

import type { DeviceStatus } from '../types/device';

export const STATUS_LABEL_KEY: Record<DeviceStatus, string> = {
  'in-use': 'devices.statusInUse',
  storage: 'devices.statusStorage',
  repair: 'devices.statusRepair',
  retired: 'devices.statusRetired',
};

// Solid color for dots and progress bars.
export const STATUS_SOLID_CLASS: Record<DeviceStatus, string> = {
  'in-use': 'bg-status-in-use',
  storage: 'bg-status-storage',
  repair: 'bg-status-repair',
  retired: 'bg-status-retired',
};

// Soft pill (tinted background + on-color text) for badges.
export const STATUS_SOFT_CLASS: Record<DeviceStatus, string> = {
  'in-use': 'bg-status-in-use-soft text-status-in-use',
  storage: 'bg-status-storage-soft text-status-storage',
  repair: 'bg-status-repair-soft text-status-repair',
  retired: 'bg-status-retired-soft text-status-retired',
};

type T = (key: string) => string;

export function StatusDot({ status, className }: { status: DeviceStatus; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-block size-2 shrink-0 rounded-full',
        STATUS_SOLID_CLASS[status],
        className,
      )}
    />
  );
}

// Colour never carries meaning alone — the label is always visible.
export function DeviceStatusBadge({ status, t }: { status: DeviceStatus; t: T }) {
  const label = t(STATUS_LABEL_KEY[status]);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
        STATUS_SOFT_CLASS[status],
      )}
    >
      <span aria-hidden className={cn('size-1.5 rounded-full', STATUS_SOLID_CLASS[status])} />
      {label}
    </span>
  );
}
