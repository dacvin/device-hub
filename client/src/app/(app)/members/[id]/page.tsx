import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentMember } from "@/lib/data/auth";
import { getMemberById } from "@/lib/data/members";
import { listDevices } from "@/lib/data/devices";
import { listActivityByActor } from "@/lib/data/activity";
import { ProfileHeader } from "./_components/profile-header";
import { DetailsCard } from "./_components/details-card";
import { DevicesManaged } from "./_components/devices-managed";
import { PermissionsCard } from "./_components/permissions-card";
import { ProfileStatsCard } from "./_components/profile-stats-card";
import { RecentActivityList } from "../../overview/_components/recent-activity";

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await getCurrentMember();
  if (!me) redirect("/login");

  const { id } = await params;
  const member = await getMemberById(id);
  if (!member) notFound();

  const t = await getTranslations("memberProfile");

  const [managedDevices, activity] = await Promise.all([
    member.departmentId && member.role !== "viewer"
      ? listDevices({ dept: member.departmentId }).then((ds) => ds.slice(0, 6))
      : Promise.resolve([]),
    listActivityByActor(member.id, 10),
  ]);

  const managedCount = managedDevices.length;

  return (
    <div className="space-y-6">
      <ProfileHeader member={member} isYou={me.id === member.id} />
      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="space-y-6">
          <DetailsCard member={member} />
          {member.role !== "viewer" ? (
            <DevicesManaged
              devices={managedDevices}
              departmentId={member.departmentId}
              departmentName={member.departmentName}
            />
          ) : null}
          <PermissionsCard role={member.role} />
        </div>
        <div className="space-y-6">
          <ProfileStatsCard member={member} managedCount={managedCount} />
          <RecentActivityList items={activity} title={t("activityTitle")} />
        </div>
      </div>
    </div>
  );
}
