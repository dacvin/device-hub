import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { PageShell } from "@/components/app/page-shell";
import { Card } from "@/components/ui/card";

export function OverviewPageSkeleton() {
  const t = useTranslations("overview");
  return (
    <PageShell title={t("title")} crumb={t("subtitle")}>
      <div className="space-y-5">
        {/* 4 KPI cards: icon + label + big value + subtitle */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5">
              <div className="flex items-start justify-between">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
              <Skeleton className="h-8 w-16 mt-3" />
              <Skeleton className="h-3 w-32 mt-2" />
            </Card>
          ))}
        </div>
        <div className="grid lg:grid-cols-[1fr_340px] gap-5">
          <div className="space-y-5">
            {/* LifecycleBar */}
            <Card className="p-5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56 mt-1.5" />
              <Skeleton className="h-3 w-full mt-5 rounded-full" />
              <div className="flex gap-4 mt-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <Skeleton className="h-2 w-2 rounded-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                ))}
              </div>
            </Card>
            {/* GroupShareBars */}
            <Card className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-40 mt-1.5" />
                </div>
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="space-y-3 mt-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-7 w-7 rounded-md" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-2 flex-1 rounded-full" />
                    <Skeleton className="h-3 w-6" />
                  </div>
                ))}
              </div>
            </Card>
          </div>
          <div className="space-y-5">
            {/* AttentionRail */}
            <Card className="p-5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48 mt-1.5" />
              <div className="space-y-3 mt-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-md" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            {/* RecentActivityList */}
            <Card className="p-5">
              <Skeleton className="h-4 w-32" />
              <div className="space-y-3 mt-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="h-7 w-7 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-40" />
                      <Skeleton className="h-2.5 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
