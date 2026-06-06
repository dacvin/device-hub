"use client";

/* eslint-disable react/no-children-prop */

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useForm, type AnyFieldApi } from "@tanstack/react-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CatalogPageShell } from "@/app/(app)/_components/catalog-page-shell";
import { CountLink } from "@/app/(app)/_components/catalog-link";
import { GroupIcon } from "@/components/app/group-icon";
import { Required } from "@/components/app/required";
import { groupFormSchema, type GroupFormValues } from "@/lib/domain/devices";
import { deleteGroupAction, saveGroupAction } from "@/app/(app)/groups/_actions";
import type { GroupWithCount } from "@/lib/data/groups";
import { cn } from "@/lib/utils";

const ICON_OPTIONS = [
  "laptop",
  "monitor",
  "printer",
  "network",
  "server",
  "smartphone",
  "webcam",
  "hard-drive",
  "layers",
];

const empty: GroupFormValues = {
  name: "",
  icon: "laptop",
  defaultInventoryCycleMonths: 12,
};

export function GroupsClient({ rows }: { rows: GroupWithCount[] }) {
  const t = useTranslations("groups");
  const tCommon = useTranslations("common");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | "new" | null>(null);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(t));
  }, [rows, search]);

  const max = Math.max(1, ...rows.map((r) => r.deviceCount));
  const editing = openId && openId !== "new" ? rows.find((r) => r.id === openId) : null;
  const totalDevices = rows.reduce((a, r) => a + r.deviceCount, 0);

  return (
    <>
      <CatalogPageShell
        title={t("title")}
        subtitle={t("subtitle")}
        metaLine={`${rows.length} groups · ${totalDevices} devices catalogued`}
        addLabel={t("addAction")}
        onAdd={() => setOpenId("new")}
        search={search}
        onSearchChange={setSearch}
      >
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-11 px-4 text-xs font-medium text-muted-foreground">{t("tableName")}</TableHead>
                <TableHead className="h-11 px-4 text-xs font-medium text-muted-foreground">{t("tableCycle")}</TableHead>
                <TableHead className="h-11 px-4 text-xs font-medium text-muted-foreground w-[200px]">{t("tableDevices")}</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id} className="group/row h-14 hover:bg-muted">
                  <TableCell className="px-4">
                    <div className="flex items-center gap-3">
                      <GroupIcon icon={r.icon} size="md" />
                      <span className="font-medium">{r.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4">{t("cycleMonthsValue", { count: r.defaultInventoryCycleMonths })}</TableCell>
                  <TableCell className="px-4">
                    <CountLink count={r.deviceCount} max={max} href={`/devices?group=${r.id}`} />
                  </TableCell>
                  <TableCell className="px-4 text-right">
                    <div className="opacity-0 group-hover/row:opacity-100 transition-opacity flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="size-[30px] border-0" onClick={() => setOpenId(r.id)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-[30px] border-0 text-destructive hover:text-destructive disabled:opacity-30"
                        disabled={r.deviceCount > 0}
                        title={r.deviceCount > 0 ? t("reassignFirst") : tCommon("delete")}
                        onClick={() => {
                          startTransition(async () => {
                            const res = await deleteGroupAction(r.id);
                            if (!res.ok) toast.error(res.error ?? tCommon("deleteFailed"));
                          });
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CatalogPageShell>

      <Dialog open={openId !== null} onOpenChange={(open) => !open && setOpenId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t("dialogEdit") : t("dialogAdd")}</DialogTitle>
            <DialogDescription>{t("dialogDescription")}</DialogDescription>
          </DialogHeader>
          <GroupForm
            initial={editing ? {
              name: editing.name,
              icon: editing.icon ?? "",
              defaultInventoryCycleMonths: editing.defaultInventoryCycleMonths,
            } : empty}
            onSubmit={async (values) => {
              const res = await saveGroupAction(editing?.id ?? null, values);
              if (res.ok) {
                setOpenId(null);
                toast.success(editing ? t("updated") : t("added"));
              } else {
                toast.error(res.error ?? tCommon("saveFailed"));
              }
            }}
            onCancel={() => setOpenId(null)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function GroupForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial: GroupFormValues;
  onSubmit: (v: GroupFormValues) => Promise<void>;
  onCancel: () => void;
}) {
  const t = useTranslations("groups");
  const tCommon = useTranslations("common");
  const form = useForm({
    defaultValues: initial,
    validators: { onSubmit: groupFormSchema },
    onSubmit: async ({ value }) => onSubmit(value),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <FieldGroup>
        <form.Field
          name="name"
          children={(f) => (
            <Field data-invalid={isInvalid(f)}>
              <FieldLabel htmlFor={f.name}>
                {t("fieldName")} <Required />
              </FieldLabel>
              <Input
                id={f.name}
                value={f.state.value}
                onChange={(e) => f.handleChange(e.target.value)}
                onBlur={f.handleBlur}
                aria-invalid={isInvalid(f)}
              />
              <FieldError errors={errs(f)} />
            </Field>
          )}
        />
        <form.Field
          name="icon"
          children={(f) => (
            <Field>
              <FieldLabel>{t("fieldIcon")}</FieldLabel>
              <div className="grid grid-cols-9 gap-1.5">
                {ICON_OPTIONS.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => f.handleChange(name)}
                    className={cn(
                      "rounded-md border p-1 flex items-center justify-center transition-colors",
                      f.state.value === name
                        ? "border-primary bg-accent text-accent-foreground"
                        : "border-border hover:border-ring"
                    )}
                    aria-label={name}
                  >
                    <GroupIcon icon={name} size="sm" />
                  </button>
                ))}
              </div>
            </Field>
          )}
        />
        <form.Field
          name="defaultInventoryCycleMonths"
          children={(f) => (
            <Field>
              <FieldLabel htmlFor={f.name}>{t("fieldCycle")}</FieldLabel>
              <Input
                id={f.name}
                type="number"
                min={1}
                max={120}
                value={f.state.value as unknown as number}
                onChange={(e) => f.handleChange(Number(e.target.value))}
              />
            </Field>
          )}
        />
      </FieldGroup>
      <DialogFooter className="mt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>{tCommon("cancel")}</Button>
        <Button type="submit">{initial.name ? tCommon("save") : tCommon("create")}</Button>
      </DialogFooter>
    </form>
  );
}

function isInvalid(f: AnyFieldApi): boolean {
  return f.state.meta.isTouched && !f.state.meta.isValid;
}

function errs(f: AnyFieldApi): { message: string }[] {
  return f.state.meta.errors
    .filter((e: unknown) => e != null)
    .map((e: unknown) => {
      if (typeof e === "string") return { message: e };
      if (e && typeof e === "object" && "message" in e)
        return { message: String((e as { message: unknown }).message) };
      return { message: String(e) };
    });
}
