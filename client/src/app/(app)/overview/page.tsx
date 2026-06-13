"use client";

import { useTranslations } from "next-intl";
import { HardDrive, CircleCheckBig, TriangleAlert, Wrench, List, Plus } from "lucide-react";
import Link from "next/link";
import { useDevices } from "@/features/devices/hooks/use-devices";
import { useGroups } from "@/features/groups/hooks/use-groups";
import { useRecentActivity } from "@/features/activity/hooks/use-recent-activity";
import { PageShell } from "@/components/app/page-shell";
import { Button } from "@/components/ui/button";
import { KpiCard } from "./_components/kpi-card";
import { LifecycleBar, type LifecycleSegment } from "./_components/lifecycle-bar";
import { GroupShareBars, type GroupShareRow } from "./_components/group-share-bars";
import { AttentionRail } from "./_components/attention-rail";
import { RecentActivityList } from "./_components/recent-activity";
import { OverviewPageSkeleton } from "./_components/page-skeleton";

export default function OverviewPage() {
  const t = useTranslations("overview");
  const devicesQ = useDevices();
  const groupsQ = useGroups();
  const activityQ = useRecentActivity(5);

  if (devicesQ.isPending || groupsQ.isPending || activityQ.isPending) {
    return <OverviewPageSkeleton />;
  }

  const devices = devicesQ.data ?? [];
  const groups = groupsQ.data ?? [];
  const activity = activityQ.data ?? [];

  const total = devices.length;
  const inUse = devices.filter((d) => d.status === "in-use").length;
  const inStorage = devices.filter((d) => d.status === "in-storage").length;
  const inRepair = devices.filter((d) => d.status === "in-repair").length;
  const retired = devices.filter((d) => d.status === "retired").length;
  const needsAttention = devices.filter((d) => d.flags.length > 0).length;
  const totalQuantity = devices.reduce((s, d) => s + d.quantity, 0);
  const distinctDepts = new Set(devices.map((d) => d.departmentId)).size;
  const avgCondition = total ? Math.round(devices.reduce((s, d) => s + d.condition, 0) / total) : 0;

  const segments: LifecycleSegment[] = [
    { key: "in-use",     label: t("statusInUse"),     count: inUse,     colorVar: "--green-500" },
    { key: "in-storage", label: t("statusInStorage"), count: inStorage, colorVar: "--status-storage" },
    { key: "in-repair",  label: t("statusInRepair"),  count: inRepair,  colorVar: "--status-repair" },
    { key: "retired",    label: t("statusRetired"),   count: retired,   colorVar: "--muted-foreground" },
  ];

  const groupCountMap = new Map<string, number>();
  for (const d of devices) {
    groupCountMap.set(d.groupId, (groupCountMap.get(d.groupId) ?? 0) + 1);
  }
  const groupShareRows: GroupShareRow[] = Array.from(groupCountMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([groupId, count]) => {
      const group = groups.find((g) => g.id === groupId);
      return {
        groupId,
        groupName: group?.name ?? groupId,
        groupIcon: group?.icon ?? null,
        count,
      };
    });

  const attentionDevices = devices.filter((d) => d.flags.length > 0);
  const attentionSubtitle = attentionDevices.length > 0
    ? t("attentionSubtitle", { count: attentionDevices.length, repair: inRepair })
    : t("attentionOnTrack");

  return (
    <PageShell
      title={t("title")}
      crumb={t("subtitle")}
      actions={
        <>
          <Button variant="outline" size="sm" asChild>
            <Link href="/devices"><List className="size-4 mr-1.5" />{t("viewInventory")}</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/devices/new"><Plus className="size-4 mr-1.5" />{t("addDevice")}</Link>
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            icon={HardDrive}
            label={t("kpiTotalDevices")}
            value={total}
            subtitle={t("kpiTotalSubtitle", { quantity: totalQuantity, departments: distinctDepts })}
          />
          <KpiCard
            icon={CircleCheckBig}
            label={t("kpiInUse")}
            value={inUse}
            subtitle={t("kpiInUseSubtitle", { storage: inStorage, retired })}
          />
          <KpiCard
            icon={TriangleAlert}
            label={t("kpiNeedsAttention")}
            value={needsAttention}
            tone={needsAttention > 0 ? "alert" : "default"}
            subtitle={t("kpiAttentionSubtitle")}
          />
          <KpiCard
            icon={Wrench}
            label={t("kpiInRepair")}
            value={inRepair}
            subtitle={t("kpiInRepairSubtitle", { avg: avgCondition })}
          />
        </div>
        <div className="grid lg:grid-cols-[1fr_340px] gap-5">
          <div className="space-y-5">
            <LifecycleBar
              segments={segments}
              total={total}
              title={t("lifecycleTitle")}
              subtitle={t("lifecycleSubtitle")}
            />
            <GroupShareBars
              rows={groupShareRows}
              total={total}
              title={t("groupShareTitle")}
              subtitle={t("groupShareSubtitle", { total })}
              manageLabel={t("groupShareManage")}
              manageHref="/groups"
            />
          </div>
          <div className="space-y-5">
            <AttentionRail
              devices={attentionDevices}
              title={t("attentionTitle")}
              subtitle={attentionSubtitle}
              emptyText={t("attentionEmpty")}
            />
            <RecentActivityList
              items={activity}
              title={t("activityTitle")}
            />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
