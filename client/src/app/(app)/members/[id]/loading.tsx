import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Back link + header */}
      <div>
        <Skeleton className="h-4 w-32 mb-4" />
        <div className="flex items-start gap-[18px]">
          <Skeleton className="size-14 rounded-full flex-none" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
      </div>

      {/* 2-col grid */}
      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Left column */}
        <div className="space-y-6">
          <Skeleton className="h-[280px] rounded-xl" />
          <Skeleton className="h-[260px] rounded-xl" />
          <Skeleton className="h-[300px] rounded-xl" />
        </div>
        {/* Right column */}
        <div className="space-y-6">
          <Skeleton className="h-[130px] rounded-xl" />
          <Skeleton className="h-[200px] rounded-xl" />
          <Skeleton className="h-[240px] rounded-xl" />
        </div>
      </div>
    </div>
  );
}
