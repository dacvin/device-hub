"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
}

const ROLE_ICONS: Record<MemberRole, React.ElementType> = {
  it_admin: ShieldCheck,
  manager: UserCog,
  viewer: Eye,
};

export function BulkActions({ selected, onClear }: BulkActionsProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const t = useTranslations("members");
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
        toast.error(t("toast.actionFailed"));
      } else {
        toast.success(t("toast.roleUpdated"));
      }
      onClear();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    toast.success(t("toast.exportStub"));
    onClear();
  }

  async function handleRemove() {
    const ok = await confirm({
      title: t("bulk.confirmRemoveTitle", { count }),
      description: t("bulk.confirmRemoveDescription"),
      confirmLabel: t("bulk.confirmRemoveCta"),
      tone: "destructive",
    });
    if (!ok) return;

    setLoading(true);
    try {
      const ids = Array.from(selected);
      const results = await Promise.all(ids.map((id) => removeMemberAction(id)));
      const failed = results.filter((r) => !r.ok).length;
      if (failed > 0) {
        toast.error(t("toast.actionFailed"));
      } else {
        toast.success(t("toast.memberRemoved"));
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
      countLabel={(n) => t("bulk.selected", { count: n })}
    >
      <Popover open={rolePopoverOpen} onOpenChange={setRolePopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" disabled={loading}>
            <UserCog className="size-3.5 mr-1.5" aria-hidden />
            {t("bulk.role")}
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
        {t("bulk.export")}
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="text-destructive hover:text-destructive"
        onClick={handleRemove}
        disabled={loading}
      >
        <UserMinus className="size-3.5 mr-1.5" aria-hidden />
        {t("bulk.remove")}
      </Button>
    </BulkActionBar>
  );
}
