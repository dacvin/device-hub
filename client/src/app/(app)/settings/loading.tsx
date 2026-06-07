import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="grid lg:grid-cols-[220px_1fr] gap-8 items-start">
      {/* Nav skeleton */}
      <div className="hidden lg:flex flex-col gap-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-9" />
        ))}
      </div>

      {/* Section skeletons */}
      <div className="flex flex-col gap-5 max-w-[720px]">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    </div>
  );
}
