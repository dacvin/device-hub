"use client";

import { useState, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, UserPlus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Member } from "@/lib/domain/members";
import type { Department } from "@/lib/domain/devices";
import { MembersTable } from "./members-table";
import { InviteDialog } from "./invite-dialog";
import { RoleFilter } from "./role-filter";

interface MembersPageClientProps {
  members: Member[];
  currentMemberId: string;
  canManage: boolean;
  departments: Department[];
  isFiltered: boolean;
  currentQ?: string;
  currentRole?: string;
  labels: {
    search: string;
    invite: string;
    export: string;
    filterAll: string;
    filterAdmins: string;
    filterManagers: string;
    filterViewers: string;
    colMember: string;
    colRole: string;
    colDepartment: string;
    colDevicesManaged: string;
    colLastActive: string;
    colStatus: string;
    youPill: string;
    statusActive: string;
    statusInvited: string;
    statusDisabled: string;
    emptyTitle: string;
    emptyDescription: string;
    emptyAction: string;
    filteredEmptyTitle: string;
    filteredEmptyDescription: string;
    metaCount: string;
    toast: {
      invitationSent: string;
      actionFailed: string;
    };
    inviteDialog: {
      title: string;
      description: string;
      name: string;
      email: string;
      emailHelper: string;
      role: string;
      department: string;
      departmentNone: string;
      cancel: string;
      submit: string;
    };
    roleLabels: {
      it_admin: string;
      manager: string;
      viewer: string;
    };
  };
}

export function MembersPageClient({
  members,
  currentMemberId,
  canManage,
  departments,
  isFiltered,
  labels,
  currentQ,
  currentRole,
}: MembersPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [inviteOpen, setInviteOpen] = useState(false);

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const params = new URLSearchParams(searchParams.toString());
      const val = e.target.value;
      if (val) {
        params.set("q", val);
      } else {
        params.delete("q");
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <>
      {/* Toolbar: filter left, search + actions right — matches mock toolbar layout */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <RoleFilter
          currentRole={currentRole}
          labels={{
            all: labels.filterAll,
            admins: labels.filterAdmins,
            managers: labels.filterManagers,
            viewers: labels.filterViewers,
          }}
        />
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" aria-hidden />
            <Input
              className="pl-8 h-9 text-sm w-[220px]"
              placeholder={labels.search}
              defaultValue={currentQ}
              onChange={handleSearch}
            />
          </div>
          <Button variant="outline" size="sm">
            <Download className="size-3.5 mr-1.5" aria-hidden />
            {labels.export}
          </Button>
          {canManage && (
            <Button size="sm" onClick={() => setInviteOpen(true)}>
              <UserPlus className="size-3.5 mr-1.5" aria-hidden />
              {labels.invite}
            </Button>
          )}
        </div>
      </div>

      <MembersTable
        members={members}
        currentMemberId={currentMemberId}
        canManage={canManage}
        labels={labels}
        isFiltered={isFiltered}
        onInviteClick={() => setInviteOpen(true)}
      />

      <InviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        departments={departments}
        labels={labels.inviteDialog}
        toastLabels={{ invitationSent: labels.toast.invitationSent, actionFailed: labels.toast.actionFailed }}
        roleLabels={labels.roleLabels}
      />
    </>
  );
}
