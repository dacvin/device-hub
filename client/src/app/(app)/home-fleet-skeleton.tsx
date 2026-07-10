import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

function SectionCardSkeleton({ rows, className }: { rows: number; className?: string }) {
  return (
    <Card className={cn('gap-0 py-0', className)}>
      <div className="flex items-center gap-2 border-b px-5 py-4">
        <Skeleton className="size-4 rounded" />
        <Skeleton className="h-4 w-32" />
      </div>
      <CardContent className="space-y-3 px-5 py-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-8" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function HomeFleetSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="gap-0 py-5">
            <CardContent className="space-y-3 px-5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="size-4 rounded" />
              </div>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <SectionCardSkeleton rows={4} className="lg:col-span-2" />
        <SectionCardSkeleton rows={6} className="lg:col-span-3" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <SectionCardSkeleton rows={5} className="lg:col-span-3" />
        <SectionCardSkeleton rows={5} className="lg:col-span-2" />
      </div>
    </div>
  );
}
