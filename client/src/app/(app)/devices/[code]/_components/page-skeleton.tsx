import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { PageTopbar } from "@/components/app/page-topbar";
import { Card } from "@/components/ui/card";

export function DeviceDetailSkeleton() {
  const t = useTranslations("devices.details");
  return (
    <>
      <PageTopbar title={t("pageTitle")} />
      <div className="px-7 py-7">
        <Skeleton className="h-4 w-32 mb-4" />
        {/* Header: icon + name/code/badges + action buttons */}
        <div className="flex flex-wrap items-start justify-between gap-[18px] mb-[22px]">
          <div className="flex items-start gap-[18px] min-w-0">
            <Skeleton className="h-14 w-14 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-64" />
              <div className="flex items-center gap-2.5">
                <Skeleton className="h-3.5 w-24" />
                <span className="inline-block h-[14px] w-px bg-border" aria-hidden />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Skeleton className="h-10 w-28 rounded-md" />
            <Skeleton className="h-10 w-10 rounded-md" />
            <Skeleton className="h-10 w-28 rounded-md" />
          </div>
        </div>
        <div className="grid grid-cols-1 [@media(min-width:1080px)]:grid-cols-[1fr_320px] gap-5 items-start">
          <div className="space-y-5 min-w-0">
            {/* 5 detail sections: Identification, Specifications, Allocation, Lifecycle, Warranty, Notes */}
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-[22px]">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-3.5 w-32" />
                </div>
                <div className="grid grid-cols-2 gap-x-7 gap-y-[18px] mt-[18px]">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <div key={j} className="space-y-1.5">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
          <aside className="space-y-5">
            {/* Condition ring card */}
            <Card className="p-[22px]">
              <Skeleton className="h-3.5 w-28" />
              <div className="mt-4 flex items-center gap-4">
                <Skeleton className="h-20 w-20 rounded-full" />
              </div>
            </Card>
            {/* Rail stats: 4 rows of icon + label + value */}
            <Card className="px-[22px] py-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-[14px] border-b border-border last:border-b-0">
                  <Skeleton className="h-[34px] w-[34px] rounded-[9px]" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3.5 w-32" />
                  </div>
                </div>
              ))}
            </Card>
            {/* Recent activity timeline */}
            <Card className="p-[22px]">
              <Skeleton className="h-3.5 w-32" />
              <div className="mt-[18px] space-y-[18px]">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </>
  );
}
