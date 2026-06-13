"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMembers } from "@/features/members/hooks/use-members";
import { useDepartments } from "@/features/departments/hooks/use-departments";
import { useCurrentMember } from "@/features/auth/hooks/use-current-member";
import { can, type MemberRole } from "@/lib/domain/members";
import { PageShell } from "@/components/app/page-shell";
import { RoleSummaryRow } from "./_components/role-summary-row";
import { MembersPageClient } from "./_components/members-page-client";
import { MembersPageSkeleton } from "./_components/page-skeleton";

export default function MembersPage() {
  const t = useTranslations("members");
  const search = useSearchParams();
  const q = search.get("q") ?? undefined;
  const role = search.get("role") ?? undefined;
  const roleFilter: MemberRole | undefined =
    role === "it_admin" || role === "manager" || role === "viewer" ? role : undefined;

  const me = useCurrentMember();
  const filtered = useMembers({ q, role: roleFilter ?? "all" });
  const summary = useMembers(roleFilter || q ? {} : { q, role: roleFilter ?? "all" });
  const departments = useDepartments();

  if (
    me.isPending || !me.data ||
    filtered.isPending || !filtered.data ||
    summary.isPending || !summary.data ||
    departments.isPending || !departments.data
  ) {
    return <MembersPageSkeleton />;
  }

  const member = me.data;
  const members = filtered.data;
  const allMembersForSummary = summary.data;
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
          departments={departments.data}
          isFiltered={isFiltered}
          currentQ={q}
          currentRole={role ?? undefined}
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
