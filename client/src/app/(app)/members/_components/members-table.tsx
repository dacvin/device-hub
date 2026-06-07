"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShieldCheck, UserCog, Eye, ArrowRight, Ellipsis } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Member, MemberRole, MemberStatus } from "@/lib/domain/members";
import { ROLE_LABEL, ROLE_TONE } from "@/lib/domain/members";
import { BulkActions } from "./bulk-actions";
import { Users } from "lucide-react";
import { EmptyState } from "@/components/app/states/empty-state";

// Role icon map
const ROLE_ICON: Record<MemberRole, React.ElementType> = {
  it_admin: ShieldCheck,
  manager: UserCog,
  viewer: Eye,
};

// Role badge classes by tone
const ROLE_BADGE_CLASSES: Record<"primary" | "secondary" | "muted", string> = {
  primary:
    "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary border-transparent",
  secondary:
    "bg-secondary text-secondary-foreground border-transparent",
  muted:
    "bg-muted text-muted-foreground border-transparent",
};

// Member status badge
const STATUS_CLASSES: Record<MemberStatus, string> = {
  active:
    "bg-[color-mix(in_oklch,var(--green-200)_55%,var(--card))] text-[var(--green-900)] dark:bg-[color-mix(in_oklch,var(--green-800)_40%,var(--card))] dark:text-[var(--green-300)]",
  invited:
    "bg-[oklch(0.96_0.05_85)] text-[oklch(0.48_0.10_70)] dark:bg-[oklch(0.34_0.06_75)] dark:text-[oklch(0.84_0.12_85)]",
  disabled:
    "bg-muted text-muted-foreground",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatLastActive(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "Active now";
  if (mins < 60) return `${mins} minutes ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return "1 week ago";
  return `${weeks} weeks ago`;
}

interface MembersTableProps {
  members: Member[];
  currentMemberId: string;
  canManage: boolean;
  labels: {
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
    bulk: {
      selected: string;
      role: string;
      export: string;
      remove: string;
      confirmRemoveTitle: string;
      confirmRemoveDescription: string;
      confirmRemoveCta: string;
    };
    toast: {
      roleUpdated: string;
      memberRemoved: string;
      actionFailed: string;
      exportStub: string;
    };
  };
  isFiltered: boolean;
  onInviteClick?: () => void;
}

export function MembersTable({
  members,
  currentMemberId,
  canManage,
  labels,
  isFiltered,
  onInviteClick,
}: MembersTableProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allVisibleIds = members.map((m) => m.id);
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every((id) => selected.has(id));
  const someSelected = allVisibleIds.some((id) => selected.has(id));

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allVisibleIds));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (members.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title={isFiltered ? labels.filteredEmptyTitle : labels.emptyTitle}
        description={isFiltered ? labels.filteredEmptyDescription : labels.emptyDescription}
        actions={
          !isFiltered && canManage && onInviteClick
            ? [{ label: labels.emptyAction, onClick: onInviteClick }]
            : undefined
        }
      />
    );
  }

  const statusLabel: Record<MemberStatus, string> = {
    active: labels.statusActive,
    invited: labels.statusInvited,
    disabled: labels.statusDisabled,
  };

  return (
    <>
      <div className="card rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-[880px]">
            <TableHeader>
              <TableRow>
                {canManage && (
                  <TableHead className="w-10 pr-0">
                    <Checkbox
                      checked={allSelected ? true : someSelected ? "indeterminate" : false}
                      onCheckedChange={toggleAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                )}
                <TableHead className="min-w-[220px]">{labels.colMember}</TableHead>
                <TableHead className="w-[120px]">{labels.colRole}</TableHead>
                <TableHead className="w-[140px]">{labels.colDepartment}</TableHead>
                <TableHead className="w-[130px]">{labels.colDevicesManaged}</TableHead>
                <TableHead className="w-[130px]">{labels.colLastActive}</TableHead>
                <TableHead className="w-[90px]">{labels.colStatus}</TableHead>
                <TableHead className="w-[78px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const RoleIcon = ROLE_ICON[member.role];
                const tone = ROLE_TONE[member.role];
                const isYou = member.id === currentMemberId;
                const isChecked = selected.has(member.id);

                return (
                  <TableRow
                    key={member.id}
                    className={cn(
                      "cursor-pointer group/row",
                      isChecked && "bg-muted/40"
                    )}
                    onClick={(e) => {
                      // Don't navigate if clicking checkbox or action buttons
                      const target = e.target as HTMLElement;
                      if (target.closest('[data-no-nav]')) return;
                      router.push(`/members/${member.id}`);
                    }}
                  >
                    {canManage && (
                      <TableCell className="w-10 pr-0" data-no-nav>
                        <div onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => toggleOne(member.id)}
                            aria-label={`Select ${member.name}`}
                          />
                        </div>
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="size-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[13px] font-semibold flex-none">
                          {getInitials(member.name)}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[14px] font-medium leading-[1.25] truncate">
                              {member.name}
                            </span>
                            {isYou && (
                              <span className="text-[11px] text-muted-foreground font-medium">
                                {labels.youPill}
                              </span>
                            )}
                          </div>
                          <span className="text-[12.5px] text-muted-foreground truncate block">
                            {member.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 h-[22px] rounded-full px-2.5 text-xs font-medium leading-none whitespace-nowrap border",
                          ROLE_BADGE_CLASSES[tone]
                        )}
                      >
                        <RoleIcon className="size-[13px]" aria-hidden />
                        {ROLE_LABEL[member.role]}
                      </span>
                    </TableCell>
                    <TableCell className="text-[13px] text-muted-foreground">
                      {member.departmentName ?? "—"}
                    </TableCell>
                    <TableCell>
                      {member.role === "viewer" ? (
                        <span className="text-[13px] text-muted-foreground">—</span>
                      ) : (
                        <span className="text-[13px] font-semibold tabular-nums">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-[13px] text-muted-foreground">
                        {formatLastActive(member.lastActiveAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex h-[22px] items-center gap-1.5 rounded-full px-2.5 text-xs font-medium leading-none whitespace-nowrap",
                          STATUS_CLASSES[member.status]
                        )}
                      >
                        <span className="size-1.5 rounded-full bg-current" aria-hidden />
                        {statusLabel[member.status]}
                      </span>
                    </TableCell>
                    <TableCell data-no-nav>
                      <div
                        className="flex items-center justify-end gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-[30px]"
                          onClick={() => router.push(`/members/${member.id}`)}
                          title="View profile"
                        >
                          <ArrowRight className="size-4" aria-hidden />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-[30px]"
                          title="More"
                        >
                          <Ellipsis className="size-4" aria-hidden />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {canManage && (
        <BulkActions
          selected={selected}
          onClear={() => setSelected(new Set())}
          labels={labels.bulk}
          toastLabels={labels.toast}
        />
      )}
    </>
  );
}
