import { Skeleton } from '@/components/ui/skeleton';

const ROWS = Array.from({ length: 8 });

export function DevicesSkeleton({ variant }: { variant: 'table' | 'list' }) {
  if (variant === 'list') {
    return (
      <ul className="divide-y overflow-hidden rounded-lg border">
        {ROWS.map((_, i) => (
          <li key={i} className="space-y-2 px-4 py-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="bg-muted/40 flex items-center gap-4 border-b px-4 py-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="hidden h-4 w-24 md:block" />
        <Skeleton className="h-4 w-16" />
      </div>
      {ROWS.map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b px-4 py-3 last:border-0">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="hidden h-4 w-24 md:block" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-10" />
        </div>
      ))}
    </div>
  );
}
