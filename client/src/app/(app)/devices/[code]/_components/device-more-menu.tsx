"use client";

import { useRouter } from "next/navigation";
import { Copy, Ellipsis, Pencil, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useConfirm } from "@/hooks/use-confirm";
import { useDeleteDevice } from "@/features/devices/hooks/use-delete-device";

interface DeviceMoreMenuProps {
  device: { id: string; code: string; name: string };
}

export function DeviceMoreMenu({ device }: DeviceMoreMenuProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const deleteMutation = useDeleteDevice();

  function onDuplicate() {
    toast.success("Device duplicated", {
      description: `A copy of '${device.name}' was created as a draft.`,
    });
  }
  function onPrint() {
    toast.success("Printing label", {
      description: `Sending ${device.code} to the label printer…`,
    });
  }
  async function onDelete() {
    const ok = await confirm({
      title: `Delete ${device.name}?`,
      description: "This moves it to the recycle bin. You can restore it later.",
      confirmLabel: "Delete",
      tone: "destructive",
    });
    if (!ok) return;
    try {
      await deleteMutation.mutateAsync(device.id);
      toast.success("Device deleted", {
        description: "Moved to the recycle bin.",
      });
      setTimeout(() => router.push("/devices"), 600);
    } catch (err) {
      toast.error("Delete failed", {
        description: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="More actions" className="size-9">
          <Ellipsis className="size-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="font-mono text-[11.5px] text-muted-foreground">
          {device.code}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push(`/devices/${device.code}/edit`)}>
          <Pencil className="size-4" aria-hidden />
          Edit device
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onDuplicate}>
          <Copy className="size-4" aria-hidden />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onPrint}>
          <Printer className="size-4" aria-hidden />
          Print label
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            void onDelete();
          }}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="size-4" aria-hidden />
          Delete device
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
