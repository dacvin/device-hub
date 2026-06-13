"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMember } from "@/features/members/hooks/use-member";
import { useDevices } from "@/features/devices/hooks/use-devices";
import { useActivityByActor } from "@/features/activity/hooks/use-activity-by-actor";
import { useCurrentMember } from "@/features/auth/hooks/use-current-member";
import { PageShell } from "@/components/app/page-shell";
import { ROLE_LABEL } from "@/lib/domain/members";
import { ProfileHeader } from "./_components/profile-header";
import { DetailsCard } from "./_components/details-card";
import { DevicesManaged } from "./_components/devices-managed";
import { PermissionsCard } from "./_components/permissions-card";
import { ProfileStatsCard } from "./_components/profile-stats-card";
import { RecentActivityList } from "../../overview/_components/recent-activity";
import { MemberProfileSkeleton } from "./_components/page-skeleton";

export default function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations("memberProfile");
  const me = useCurrentMember();
  const memberQ = useMember(id);
  const enableDevices = !!(memberQ.data?.departmentId && memberQ.data.role !== "viewer");
  const devicesQ = useDevices(
    enableDevices && memberQ.data ? { dept: memberQ.data.departmentId! } : {},
    { enabled: enableDevices },
  );
  const activityQ = useActivityByActor(id, 10);

  if (me.isPending || memberQ.isPending || activityQ.isPending) {
    return <MemberProfileSkeleton />;
  }
  if (!memberQ.data) notFound();

  const member = memberQ.data;
  const managedDevices = (devicesQ.data ?? []).slice(0, 6);
  const activity = activityQ.data ?? [];
  const managedCount = managedDevices.length;
  const roleCrumb = [ROLE_LABEL[member.role], member.departmentName].filter(Boolean).join(" · ");

  return (
    <PageShell title={member.name} crumb={roleCrumb || undefined}>
      <div className="space-y-6">
        <ProfileHeader member={member} isYou={me.data?.id === member.id} />
        <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
          <div className="space-y-6">
            <DetailsCard member={member} />
            <DevicesManaged
              devices={managedDevices}
              departmentId={member.departmentId}
              departmentName={member.departmentName}
              isViewer={member.role === "viewer"}
            />
            <PermissionsCard role={member.role} />
          </div>
          <div className="space-y-6">
            <ProfileStatsCard member={member} managedCount={managedCount} />
            <RecentActivityList items={activity} title={t("activityTitle")} />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
