import { Skeleton } from '@/components/ui/skeleton';

const ROWS = Array.from({ length: 6 });

export function CatalogSkeleton({ columnCount }: { columnCount: number }) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="bg-muted/40 flex items-center gap-4 border-b px-4 py-3">
        {Array.from({ length: columnCount }).map((_, i) => (
          <Skeleton key={i} className={i === 0 ? 'h-4 w-40' : 'h-4 w-20'} />
        ))}
      </div>
      {ROWS.map((_, r) => (
        <div key={r} className="flex items-center gap-4 border-b px-4 py-3.5 last:border-0">
          {Array.from({ length: columnCount }).map((_, i) => (
            <Skeleton key={i} className={i === 0 ? 'h-4 w-48' : 'h-4 w-24'} />
          ))}
        </div>
      ))}
    </div>
  );
}
