"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserCog, Download, UserMinus, ShieldCheck, Eye } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { BulkActionBar } from "@/components/app/bulk-action-bar";
import { useConfirm } from "@/hooks/use-confirm";
import { updateMemberRoleAction, removeMemberAction } from "../_actions";
import type { MemberRole } from "@/lib/domain/members";
import { ROLE_LABEL } from "@/lib/domain/members";

interface BulkActionsProps {
  selected: Set<string>;
  onClear: () => void;
  labels: {
    selected: string;
    role: string;
    export: string;
    remove: string;
    confirmRemoveTitle: string;
    confirmRemoveDescription: string;
    confirmRemoveCta: string;
  };
  toastLabels: {
    roleUpdated: string;
    memberRemoved: string;
    actionFailed: string;
    exportStub: string;
  };
}

const ROLE_ICONS: Record<MemberRole, React.ElementType> = {
  it_admin: ShieldCheck,
  manager: UserCog,
  viewer: Eye,
};

export function BulkActions({ selected, onClear, labels, toastLabels }: BulkActionsProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const [rolePopoverOpen, setRolePopoverOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const count = selected.size;

  async function handleRoleChange(role: MemberRole) {
    setRolePopoverOpen(false);
    setLoading(true);
    try {
      const ids = Array.from(selected);
      const results = await Promise.all(ids.map((id) => updateMemberRoleAction(id, role)));
      const failed = results.filter((r) => !r.ok).length;
      if (failed > 0) {
        toast.error(toastLabels.actionFailed);
      } else {
        toast.success(toastLabels.roleUpdated);
      }
      onClear();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    toast.success(toastLabels.exportStub);
    onClear();
  }

  async function handleRemove() {
    const ok = await confirm({
      title: labels.confirmRemoveTitle.replace("{count}", String(count)),
      description: labels.confirmRemoveDescription,
      confirmLabel: labels.confirmRemoveCta,
      tone: "destructive",
    });
    if (!ok) return;

    setLoading(true);
    try {
      const ids = Array.from(selected);
      const results = await Promise.all(ids.map((id) => removeMemberAction(id)));
      const failed = results.filter((r) => !r.ok).length;
      if (failed > 0) {
        toast.error(toastLabels.actionFailed);
      } else {
        toast.success(toastLabels.memberRemoved);
      }
      onClear();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <BulkActionBar
      selectedCount={count}
      onClear={onClear}
      countLabel={(n) => labels.selected.replace("{count}", String(n))}
    >
      <Popover open={rolePopoverOpen} onOpenChange={setRolePopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" disabled={loading}>
            <UserCog className="size-3.5 mr-1.5" aria-hidden />
            {labels.role}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-44 p-1" align="center" side="top">
          <p className="px-2 py-1 text-xs font-medium text-muted-foreground">Set role</p>
          {(["it_admin", "manager", "viewer"] as MemberRole[]).map((role) => {
            const Icon = ROLE_ICONS[role];
            return (
              <button
                key={role}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-accent transition-colors"
                onClick={() => handleRoleChange(role)}
              >
                <Icon className="size-4 text-muted-foreground" aria-hidden />
                {ROLE_LABEL[role]}
              </button>
            );
          })}
        </PopoverContent>
      </Popover>

      <Button variant="outline" size="sm" onClick={handleExport} disabled={loading}>
        <Download className="size-3.5 mr-1.5" aria-hidden />
        {labels.export}
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="text-destructive hover:text-destructive"
        onClick={handleRemove}
        disabled={loading}
      >
        <UserMinus className="size-3.5 mr-1.5" aria-hidden />
        {labels.remove}
      </Button>
    </BulkActionBar>
  );
}
