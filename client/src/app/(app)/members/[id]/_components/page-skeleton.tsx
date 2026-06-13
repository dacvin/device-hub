import { Skeleton } from "@/components/ui/skeleton";
import { PageShell } from "@/components/app/page-shell";
import { Card } from "@/components/ui/card";

export function MemberProfileSkeleton() {
  return (
    <PageShell title="" crumb="">
      <div className="space-y-6">
        {/* Profile header: avatar + name + role/dept pills + actions */}
        <Card className="p-5">
          <div className="flex items-start gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-28 rounded-full" />
              </div>
            </div>
          </div>
        </Card>
        <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
          <div className="space-y-6">
            {/* DetailsCard */}
            <Card className="p-5">
              <Skeleton className="h-4 w-24" />
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 mt-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            </Card>
            {/* DevicesManaged */}
            <Card className="p-5">
              <Skeleton className="h-4 w-32" />
              <div className="grid grid-cols-2 gap-3 mt-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-md border border-border">
                    <Skeleton className="h-9 w-9 rounded-md" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-3.5 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            {/* PermissionsCard */}
            <Card className="p-5">
              <Skeleton className="h-4 w-28" />
              <div className="space-y-2 mt-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                ))}
              </div>
            </Card>
          </div>
          <div className="space-y-6">
            {/* ProfileStatsCard */}
            <Card className="p-5">
              <Skeleton className="h-4 w-24" />
              <div className="space-y-3 mt-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-4 w-12" />
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
