"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CircleDot, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { BulkActionBar } from "@/components/app/bulk-action-bar";
import { useConfirm } from "@/hooks/use-confirm";
import { DEVICE_STATUSES, type DeviceStatus } from "@/lib/domain/devices";
import { useBulkUpdateStatus } from "@/features/devices/hooks/use-bulk-update-status";
import { useBulkDelete } from "@/features/devices/hooks/use-bulk-delete";

interface DeviceBulkActionsProps {
  selected: Set<string>;
  onClear: () => void;
}

export function DeviceBulkActions({ selected, onClear }: DeviceBulkActionsProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const t = useTranslations("devices.list");
  const tStatus = useTranslations("devices.status");
  const tCommon = useTranslations("common");
  const bulkUpdateStatus = useBulkUpdateStatus();
  const bulkDelete = useBulkDelete();
  const [statusOpen, setStatusOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const count = selected.size;

  async function handleStatus(status: DeviceStatus) {
    setStatusOpen(false);
    setLoading(true);
    try {
      const ids = Array.from(selected);
      try {
        await bulkUpdateStatus.mutateAsync({ ids, status });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : tCommon("saveFailed"));
        return;
      }
      toast.success(t("bulk.toastStatusUpdated"), {
        description: t("bulk.toastStatusUpdatedDesc", { count }),
      });
      onClear();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    toast.success(t("bulk.toastExportStarted"), {
      description: t("bulk.toastExportStartedDesc", { count }),
    });
    onClear();
  }

  async function handleDelete() {
    const ok = await confirm({
      title: t("bulk.confirmDeleteTitle", { count }),
      description: t("bulk.confirmDeleteDescription"),
      confirmLabel: t("bulk.confirmDeleteCta"),
      tone: "destructive",
    });
    if (!ok) return;

    setLoading(true);
    try {
      const ids = Array.from(selected);
      try {
        await bulkDelete.mutateAsync(ids);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : tCommon("deleteFailed"));
        return;
      }
      toast.success(t("bulk.toastDeleted"), {
        description: t("bulk.toastDeletedDesc", { count }),
      });
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
      <Popover open={statusOpen} onOpenChange={setStatusOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" disabled={loading}>
            <CircleDot className="size-3.5 mr-1.5" aria-hidden />
            {t("bulk.status")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-44 p-1" align="center" side="top">
          <p className="px-2 py-1 text-xs font-medium text-muted-foreground">{t("bulk.setStatus")}</p>
          {DEVICE_STATUSES.map((s) => (
            <button
              key={s}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-accent transition-colors"
              onClick={() => handleStatus(s as DeviceStatus)}
            >
              {tStatus(s)}
            </button>
          ))}
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
        onClick={handleDelete}
        disabled={loading}
      >
        <Trash2 className="size-3.5 mr-1.5" aria-hidden />
        {t("bulk.delete")}
      </Button>
    </BulkActionBar>
  );
}
