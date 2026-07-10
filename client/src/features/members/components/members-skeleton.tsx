import { Skeleton } from '@/components/ui/skeleton';

const ROWS = Array.from({ length: 8 });

export function MembersSkeleton({ variant }: { variant: 'table' | 'list' }) {
  return (
    <div className="overflow-hidden rounded-lg border">
      {variant === 'table' && (
        <div className="bg-muted/40 flex items-center gap-4 border-b px-4 py-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="ml-auto h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="hidden h-4 w-16 md:block" />
        </div>
      )}
      {ROWS.map((_, i) => (
        <div key={i} className="flex items-center gap-3 border-b px-4 py-3 last:border-0">
          <Skeleton className="size-8 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-52" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}
