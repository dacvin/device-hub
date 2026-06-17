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
import { useSaveUnit } from "@/features/catalogs/hooks/use-save-catalog";
import { useCatalog } from "@/features/catalogs/hooks/use-catalog";
import { CatalogPageSkeleton } from "../../_components/catalog-page-skeleton";
import type { CatalogRow } from "@/lib/domain/catalogs";

export function UnitsClient() {
  const { data, isPending } = useCatalog("units");
  const saveMutation = useSaveUnit();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogRow | null>(null);
  const [name, setName] = useState("");
  const [abbreviation, setAbbreviation] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function openCreate() {
    setEditing(null);
    setName("");
    setAbbreviation("");
    setDescription("");
    setOpen(true);
  }
  function openEdit(row: CatalogRow) {
    setEditing(row);
    setName(row.name);
    setAbbreviation(row.abbreviation ?? "");
    setDescription(row.description ?? "");
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
        abbreviation,
        description,
      });
      toast.success(editing ? "Unit updated" : "Unit created");
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
          kind: "units",
          singular: "Unit",
          plural: "Units",
          filterKey: "unit",
          configColumns: [
            {
              header: "Abbreviation",
              render: (r) => (
                <span className="text-[13px] font-mono text-muted-foreground">
                  {r.abbreviation || "—"}
                </span>
              ),
            },
            {
              header: "Description",
              render: (r) => (
                <span className="text-[13px] text-muted-foreground">
                  {r.description || "—"}
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
            <DialogTitle>{editing ? "Edit unit" : "Create unit"}</DialogTitle>
            <DialogDescription>
              New units become selectable when adding or editing a device.
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
                placeholder="Piece"
              />
            </div>
            <div>
              <label className="text-[12.5px] font-medium block mb-1.5">
                Abbreviation
              </label>
              <Input
                value={abbreviation}
                onChange={(e) => setAbbreviation(e.target.value)}
                placeholder="pc"
                className="font-mono"
              />
            </div>
            <div>
              <label className="text-[12.5px] font-medium block mb-1.5">
                Description
              </label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Single item, counted individually"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onSubmit} disabled={submitting}>
              {editing ? "Save changes" : "Create unit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
