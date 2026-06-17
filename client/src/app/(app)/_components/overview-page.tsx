"use client";

import { PageShell } from "@/components/app/page-shell";
import { KpiRow } from "@/features/overview/_components/kpi-row";
import { LifecycleCard } from "@/features/overview/_components/lifecycle-card";
import { GroupsCard } from "@/features/overview/_components/groups-card";
import { AttentionCard } from "@/features/overview/_components/attention-card";
import { ActivityCard } from "@/features/overview/_components/activity-card";
import { useOverviewSummary } from "@/features/overview/hooks/use-overview-summary";
import { useRecentActivity } from "@/features/activity/hooks/use-activity";
import { OverviewPageSkeleton } from "./overview-page-skeleton";

export function OverviewPage() {
  const summary = useOverviewSummary();
  const activity = useRecentActivity(12);

  if (summary.isPending || activity.isPending) {
    return (
      <PageShell title="Overview" crumb="Fleet health across the organization">
        <OverviewPageSkeleton />
      </PageShell>
    );
  }

  if (summary.error || !summary.data) {
    return (
      <PageShell title="Overview" crumb="Fleet health across the organization">
        <div className="p-7 text-[13px] text-destructive">
          Failed to load overview. {summary.error?.message}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Overview" crumb="Fleet health across the organization">
      <div className="flex flex-col gap-5">
        <KpiRow data={summary.data} />
        <div className="grid gap-5 items-start grid-cols-1 min-[1080px]:[grid-template-columns:minmax(0,1fr)_340px]">
          <div className="flex flex-col gap-5 min-w-0">
            <LifecycleCard data={summary.data} />
            <GroupsCard data={summary.data} />
          </div>
          <div className="flex flex-col gap-5">
            <AttentionCard data={summary.data} />
            <ActivityCard activity={activity.data ?? []} />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
