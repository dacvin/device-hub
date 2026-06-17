"use client";

import { useState } from "react";
import {
  Blocks,
  Box,
  Boxes,
  Container,
  Cpu,
  HardDrive,
  Keyboard,
  Laptop,
  Layers,
  Monitor,
  MousePointer,
  Network,
  Package,
  Printer,
  Router,
  Ruler,
  Scale3d,
  Server,
  Smartphone,
  Tablet,
  Tv,
  Webcam,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GroupIconTile } from "@/features/overview/_components/group-icon-tile";
import { CatalogTable } from "../../_components/catalog-table";
import { useSaveGroup } from "@/features/catalogs/hooks/use-save-catalog";
import { useCatalog } from "@/features/catalogs/hooks/use-catalog";
import type { CatalogRow } from "@/lib/domain/catalogs";
import { CatalogPageSkeleton } from "../../_components/catalog-page-skeleton";

const ICON_OPTIONS: { value: string; label: string; Icon: LucideIcon }[] = [
  { value: "laptop", label: "Laptop", Icon: Laptop },
  { value: "monitor", label: "Monitor", Icon: Monitor },
  { value: "printer", label: "Printer", Icon: Printer },
  { value: "network", label: "Network", Icon: Network },
  { value: "server", label: "Server", Icon: Server },
  { value: "smartphone", label: "Smartphone", Icon: Smartphone },
  { value: "webcam", label: "Webcam", Icon: Webcam },
  { value: "hard-drive", label: "Hard drive", Icon: HardDrive },
  { value: "cpu", label: "CPU", Icon: Cpu },
  { value: "keyboard", label: "Keyboard", Icon: Keyboard },
  { value: "mouse-pointer", label: "Mouse", Icon: MousePointer },
  { value: "tablet", label: "Tablet", Icon: Tablet },
  { value: "router", label: "Router", Icon: Router },
  { value: "tv", label: "TV", Icon: Tv },
  { value: "box", label: "Box", Icon: Box },
  { value: "boxes", label: "Boxes", Icon: Boxes },
  { value: "package", label: "Package", Icon: Package },
  { value: "layers", label: "Layers", Icon: Layers },
  { value: "container", label: "Container", Icon: Container },
  { value: "scale-3d", label: "Scale 3D", Icon: Scale3d },
  { value: "ruler", label: "Ruler", Icon: Ruler },
  { value: "blocks", label: "Blocks", Icon: Blocks },
];

export function GroupsClient() {
  const { data, isPending } = useCatalog("groups");
  const saveMutation = useSaveGroup();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogRow | null>(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("laptop");
  const [cycle, setCycle] = useState(12);
  const [submitting, setSubmitting] = useState(false);

  function openCreate() {
    setEditing(null);
    setName("");
    setIcon("laptop");
    setCycle(12);
    setOpen(true);
  }
  function openEdit(row: CatalogRow) {
    setEditing(row);
    setName(row.name);
    setIcon(row.icon ?? "laptop");
    setCycle(row.cycle ?? 12);
    setOpen(true);
  }

  async function onSubmit() {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSubmitting(true);
    try {
      await saveMutation.mutateAsync({
        id: editing?.id,
        name,
        icon,
        cycle,
      });
      toast.success(editing ? "Group updated" : "Group created");
      setOpen(false);
    } catch (err) {
      toast.error("Save failed", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (isPending) return <CatalogPageSkeleton />;

  return (
    <>
      <CatalogTable
        config={{
          kind: "groups",
          singular: "Group",
          plural: "Groups",
          filterKey: "group",
          showRowIcon: true,
          configColumns: [
            {
              header: "Default inventory cycle",
              render: (r) => (
                <span className="text-[13px] text-muted-foreground">
                  {r.cycle ?? "—"} months
                </span>
              ),
            },
          ],
        }}
        rows={data?.rows ?? []}
        totalDevices={data?.totalDevices ?? 0}
        onCreate={openCreate}
        onEdit={openEdit}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit group" : "Create group"}</DialogTitle>
            <DialogDescription>
              New groups become selectable when adding or editing a device.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-[12.5px] font-medium block mb-1.5">
                Name <span className="text-destructive">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Laptop"
              />
            </div>
            <div>
              <label className="text-[12.5px] font-medium block mb-1.5">Icon</label>
              <div className="grid grid-cols-6 gap-2 max-[640px]:grid-cols-5">
                {ICON_OPTIONS.map((opt) => {
                  const Icon = opt.Icon;
                  const active = opt.value === icon;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setIcon(opt.value)}
                      aria-label={opt.label}
                      className={cn(
                        "size-10 rounded-md grid place-items-center transition-colors",
                        active
                          ? "bg-secondary text-secondary-foreground ring-2 ring-ring/40"
                          : "bg-card text-muted-foreground ring-1 ring-foreground/10 hover:bg-muted",
                      )}
                    >
                      <Icon className="size-4" aria-hidden />
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center gap-2 text-[12.5px] text-muted-foreground">
                <GroupIconTile icon={icon} groupName="Preview" />
                <span>Preview</span>
              </div>
            </div>
            <div>
              <label className="text-[12.5px] font-medium block mb-1.5">
                Default inventory cycle (months)
              </label>
              <Input
                type="number"
                min={1}
                max={120}
                value={cycle}
                onChange={(e) => setCycle(parseInt(e.target.value, 10) || 12)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onSubmit} disabled={submitting}>
              {editing ? "Save changes" : "Create group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
