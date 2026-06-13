"use client";

/* eslint-disable react/no-children-prop */

import { useMemo, useState } from "react";
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
import { Required } from "@/components/app/required";
import { departmentFormSchema, type DepartmentFormValues } from "@/lib/domain/devices";
import { useSaveDepartment } from "@/features/departments/hooks/use-save-department";
import { useDeleteDepartment } from "@/features/departments/hooks/use-delete-department";
import type { DepartmentWithCount } from "@/features/departments/api/list-departments-with-counts";

const empty: DepartmentFormValues = { name: "", manager: "", primaryLocation: "" };

export function DepartmentsClient({ rows }: { rows: DepartmentWithCount[] }) {
  const t = useTranslations("departments");
  const tCommon = useTranslations("common");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | "new" | null>(null);
  const saveDepartment = useSaveDepartment();
  const deleteDepartment = useDeleteDepartment();

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
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-11 px-4 text-xs font-medium text-muted-foreground">{t("tableName")}</TableHead>
                <TableHead className="h-11 px-4 text-xs font-medium text-muted-foreground">{t("tableManager")}</TableHead>
                <TableHead className="h-11 px-4 text-xs font-medium text-muted-foreground">{t("tableLocation")}</TableHead>
                <TableHead className="h-11 px-4 text-xs font-medium text-muted-foreground w-[200px]">{t("tableDevices")}</TableHead>
                <TableHead className="h-11 w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id} className="group/row h-14 hover:bg-muted">
                  <TableCell className="px-4 font-medium">{r.name}</TableCell>
                  <TableCell className="px-4">{r.manager ?? <Muted>—</Muted>}</TableCell>
                  <TableCell className="px-4">{r.primaryLocation ?? <Muted>—</Muted>}</TableCell>
                  <TableCell className="px-4">
                    <CountLink count={r.deviceCount} max={max} href={`/devices?dept=${r.id}`} />
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
                          deleteDepartment.mutate(r.id, {
                            onError: (e) => toast.error(e instanceof Error ? e.message : tCommon("deleteFailed")),
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
              try {
                await saveDepartment.mutateAsync({ id: editing?.id ?? null, values });
                setOpenId(null);
                toast.success(editing ? t("updated") : t("added"));
              } catch (e) {
                toast.error(e instanceof Error ? e.message : tCommon("saveFailed"));
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
