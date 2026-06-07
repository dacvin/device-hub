import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { HardDrive, CircleCheckBig, TriangleAlert, Wrench } from "lucide-react";
import { getCurrentMember } from "@/lib/data/auth";
import { listDevices } from "@/lib/data/devices";
import { listGroups } from "@/lib/data/groups";
import { listRecentActivity } from "@/lib/data/activity";
import { KpiCard } from "./_components/kpi-card";
import { LifecycleBar, type LifecycleSegment } from "./_components/lifecycle-bar";

export default async function OverviewPage() {
  const member = await getCurrentMember();
  if (!member) redirect("/login");

  const t = await getTranslations("overview");

  const [devices, groups, activity] = await Promise.all([
    listDevices(),
    listGroups(),
    listRecentActivity(5),
  ]);

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
    { key: "in-storage", label: t("statusInStorage"), count: inStorage, colorVar: "--chart-2" },
    { key: "in-repair",  label: t("statusInRepair"),  count: inRepair,  colorVar: "--chart-3" },
    { key: "retired",    label: t("statusRetired"),   count: retired,   colorVar: "--muted-foreground" },
  ];

  // suppress unused-var warnings until Task 6.2 wires these in
  void groups;
  void activity;

  return (
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
          {/* GroupShareBars added in Task 6.2 */}
        </div>
        <div className="space-y-5">
          {/* AttentionRail + RecentActivity added in Task 6.2 */}
        </div>
      </div>
    </div>
  );
}
