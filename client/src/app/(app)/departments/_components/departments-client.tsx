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
import { CountLink, MiniBar } from "@/app/(app)/_components/catalog-link";
import { departmentFormSchema, type DepartmentFormValues } from "@/lib/domain/devices";
import {
  deleteDepartmentAction,
  saveDepartmentAction,
} from "@/app/(app)/departments/_actions";
import type { DepartmentWithCount } from "@/lib/data/departments";

const empty: DepartmentFormValues = { name: "", manager: "", primaryLocation: "" };

export function DepartmentsClient({ rows }: { rows: DepartmentWithCount[] }) {
  const t = useTranslations("departments");
  const tCommon = useTranslations("common");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | "new" | null>(null);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(t) ||
        (r.manager ?? "").toLowerCase().includes(t) ||
        (r.primaryLocation ?? "").toLowerCase().includes(t)
    );
  }, [rows, search]);

  const max = Math.max(1, ...rows.map((r) => r.deviceCount));
  const editing = openId && openId !== "new" ? rows.find((r) => r.id === openId) : null;
  const totalDevices = rows.reduce((a, r) => a + r.deviceCount, 0);

  return (
    <>
      <CatalogPageShell
        title={t("title")}
        subtitle={t("subtitle")}
        metaLine={`${rows.length} departments · ${totalDevices} devices catalogued`}
        addLabel={t("addAction")}
        onAdd={() => setOpenId("new")}
        search={search}
        onSearchChange={setSearch}
      >
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">{t("tableName")}</TableHead>
                <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">{t("tableManager")}</TableHead>
                <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">{t("tableLocation")}</TableHead>
                <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">{t("tableDevices")}</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id} className="group/row h-14 hover:bg-muted/40">
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{r.manager ?? <Muted>—</Muted>}</TableCell>
                  <TableCell>{r.primaryLocation ?? <Muted>—</Muted>}</TableCell>
                  <TableCell>
                    <CountLink count={r.deviceCount} href={`/devices?dept=${r.id}`} />
                    <MiniBar value={r.deviceCount} max={max} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="opacity-0 group-hover/row:opacity-100 transition-opacity flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="size-7" onClick={() => setOpenId(r.id)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive hover:text-destructive disabled:opacity-30"
                        disabled={r.deviceCount > 0}
                        title={r.deviceCount > 0 ? t("reassignFirst") : tCommon("delete")}
                        onClick={() => {
                          startTransition(async () => {
                            const res = await deleteDepartmentAction(r.id);
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
          <DepartmentForm
            initial={editing ? {
              name: editing.name,
              manager: editing.manager ?? "",
              primaryLocation: editing.primaryLocation ?? "",
            } : empty}
            onSubmit={async (values) => {
              const res = await saveDepartmentAction(editing?.id ?? null, values);
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

function Muted({ children }: { children: React.ReactNode }) {
  return <span className="text-muted-foreground">{children}</span>;
}

function DepartmentForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial: DepartmentFormValues;
  onSubmit: (v: DepartmentFormValues) => Promise<void>;
  onCancel: () => void;
}) {
  const t = useTranslations("departments");
  const tCommon = useTranslations("common");
  const form = useForm({
    defaultValues: initial,
    validators: { onSubmit: departmentFormSchema },
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
              <FieldLabel htmlFor={f.name}>{t("fieldName")} *</FieldLabel>
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
          name="manager"
          children={(f) => (
            <Field>
              <FieldLabel htmlFor={f.name}>{t("fieldManager")}</FieldLabel>
              <Input id={f.name} value={f.state.value ?? ""} onChange={(e) => f.handleChange(e.target.value)} />
            </Field>
          )}
        />
        <form.Field
          name="primaryLocation"
          children={(f) => (
            <Field>
              <FieldLabel htmlFor={f.name}>{t("fieldLocation")}</FieldLabel>
              <Input id={f.name} value={f.state.value ?? ""} onChange={(e) => f.handleChange(e.target.value)} />
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
