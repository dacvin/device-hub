import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentMember } from "@/lib/data/auth";
import { listMembers } from "@/lib/data/members";
import { listDepartments } from "@/lib/data/departments";
import { can } from "@/lib/domain/members";
import { PageShell } from "@/components/app/page-shell";
import { RoleSummaryRow } from "./_components/role-summary-row";
import { MembersPageClient } from "./_components/members-page-client";

interface MembersPageProps {
  searchParams: Promise<{ q?: string; role?: string }>;
}

export default async function MembersPage({ searchParams }: MembersPageProps) {
  const member = await getCurrentMember();
  if (!member) redirect("/login");

  const { q, role } = await searchParams;
  const t = await getTranslations("members");

  const roleFilter = role === "it_admin" || role === "manager" || role === "viewer" ? role : undefined;

  const [members, departments] = await Promise.all([
    listMembers({ q, role: roleFilter ?? "all" }),
    listDepartments(),
  ]);

  // For role-summary cards, always show full totals
  const allMembersForSummary = (roleFilter || q)
    ? await listMembers({})
    : members;
  const totalAdmins = allMembersForSummary.filter((m) => m.role === "it_admin").length;
  const totalManagers = allMembersForSummary.filter((m) => m.role === "manager").length;
  const totalViewers = allMembersForSummary.filter((m) => m.role === "viewer").length;

  const canManage = can(member.role, "manageMembers");
  const isFiltered = !!(q || roleFilter);

  return (
    <PageShell title={t("title")} crumb={t("subtitle")}>
      <div className="space-y-5">

      <RoleSummaryRow
        adminCount={totalAdmins}
        managerCount={totalManagers}
        viewerCount={totalViewers}
        labels={{
          admins: t("summaryAdmins"),
          managers: t("summaryManagers"),
          viewers: t("summaryViewers"),
          capAdmin: t("capAdmin"),
          capManager: t("capManager"),
          capViewer: t("capViewer"),
        }}
      />

      <MembersPageClient
        members={members}
        currentMemberId={member.id}
        canManage={canManage}
        departments={departments}
        isFiltered={isFiltered}
        currentQ={q}
        currentRole={role}
        labels={{
          search: t("search"),
          invite: t("invite"),
          export: t("export"),
          filterAll: t("filterAll"),
          filterAdmins: t("filterAdmins"),
          filterManagers: t("filterManagers"),
          filterViewers: t("filterViewers"),
          colMember: t("colMember"),
          colRole: t("colRole"),
          colDepartment: t("colDepartment"),
          colDevicesManaged: t("colDevicesManaged"),
          colLastActive: t("colLastActive"),
          colStatus: t("colStatus"),
          youPill: t("youPill"),
          statusActive: t("statusActive"),
          statusInvited: t("statusInvited"),
          statusDisabled: t("statusDisabled"),
          emptyTitle: t("emptyTitle"),
          emptyDescription: t("emptyDescription"),
          emptyAction: t("emptyAction"),
          filteredEmptyTitle: t("filteredEmptyTitle"),
          filteredEmptyDescription: t("filteredEmptyDescription"),
          metaCount: t("metaCount", { count: members.length }),
          toast: {
            invitationSent: t("toast.invitationSent"),
            actionFailed: t("toast.actionFailed"),
          },
          inviteDialog: {
            title: t("inviteDialog.title"),
            description: t("inviteDialog.description"),
            name: t("inviteDialog.name"),
            email: t("inviteDialog.email"),
            emailHelper: t("inviteDialog.emailHelper"),
            role: t("inviteDialog.role"),
            department: t("inviteDialog.department"),
            departmentNone: t("inviteDialog.departmentNone"),
            cancel: t("inviteDialog.cancel"),
            submit: t("inviteDialog.submit"),
          },
          roleLabels: {
            it_admin: t("roleItAdmin"),
            manager: t("roleManager"),
            viewer: t("roleViewer"),
          },
        }}
      />
    </div>
    </PageShell>
  );
}
