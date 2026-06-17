"use client";

import { useState } from "react";
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
import { CatalogTable } from "../../_components/catalog-table";
import { useSaveManufacturer } from "@/features/catalogs/hooks/use-save-catalog";
import { useCatalog } from "@/features/catalogs/hooks/use-catalog";
import { CatalogPageSkeleton } from "../../_components/catalog-page-skeleton";
import type { CatalogRow } from "@/lib/domain/catalogs";

export function ManufacturersClient() {
  const { data, isPending } = useCatalog("manufacturers");
  const saveMutation = useSaveManufacturer();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogRow | null>(null);
  const [name, setName] = useState("");
  const [support, setSupport] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function openCreate() {
    setEditing(null);
    setName("");
    setSupport("");
    setOpen(true);
  }
  function openEdit(row: CatalogRow) {
    setEditing(row);
    setName(row.name);
    setSupport(row.supportContact ?? "");
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
        supportContact: support,
      });
      toast.success(editing ? "Manufacturer updated" : "Manufacturer created");
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
          kind: "manufacturers",
          singular: "Manufacturer",
          plural: "Manufacturers",
          filterKey: "mfr",
          configColumns: [
            {
              header: "Support contact",
              render: (r) => (
                <span className="text-[13px] font-mono text-muted-foreground">
                  {r.supportContact || "—"}
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
            <DialogTitle>
              {editing ? "Edit manufacturer" : "Create manufacturer"}
            </DialogTitle>
            <DialogDescription>
              New manufacturers become selectable when adding or editing a device.
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
                placeholder="Dell"
              />
            </div>
            <div>
              <label className="text-[12.5px] font-medium block mb-1.5">
                Support contact
              </label>
              <Input
                value={support}
                onChange={(e) => setSupport(e.target.value)}
                placeholder="support@dell.com · +1 555-0100"
                className="font-mono"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onSubmit} disabled={submitting}>
              {editing ? "Save changes" : "Create manufacturer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
