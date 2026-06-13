import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { PageTopbar } from "@/components/app/page-topbar";

interface Props {
  pageTitle: string;
  pageSubtitle?: string;
}

export function DeviceFormSkeleton({ pageTitle, pageSubtitle }: Props) {
  return (
    <>
      <PageTopbar title={pageTitle} crumb={pageSubtitle} />
      <div className="px-7 py-7 grid grid-cols-1 [@media(min-width:1080px)]:grid-cols-[1fr_240px] gap-6 items-start">
        <div className="space-y-5">
          {/* 5 form sections: general, classification, lifecycle, warranty, photos/docs */}
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-64 mt-2" />
              <div className="grid grid-cols-2 gap-x-6 gap-y-5 mt-6">
                {Array.from({ length: 6 }).map((_, j) => (
                  <div key={j} className="space-y-2">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-9 w-full rounded-md" />
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
        {/* Right rail: section nav + save button */}
        <aside className="space-y-3 sticky top-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full rounded-md" />
          ))}
          <Skeleton className="h-10 w-full rounded-md mt-4" />
        </aside>
      </div>
    </>
  );
}
