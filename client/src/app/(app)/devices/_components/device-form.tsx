"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Activity,
  ArrowLeft,
  Info,
  Paperclip,
  ShieldCheck,
  StickyNote,
  Tags,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useConfirm } from "@/hooks/use-confirm";
import { GroupIconTile } from "@/features/overview/_components/group-icon-tile";
import { useCreateDevice } from "@/features/devices/hooks/use-create-device";
import { useUpdateDevice } from "@/features/devices/hooks/use-update-device";
import { useDeleteDevice } from "@/features/devices/hooks/use-delete-device";
import { deviceFormSchema, type DeviceFormValues } from "@/lib/zod/device-form";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "general", label: "General", icon: Info },
  { id: "classification", label: "Classification", icon: Tags },
  { id: "lifecycle", label: "Lifecycle", icon: Activity },
  { id: "warranty", label: "Warranty", icon: ShieldCheck },
  { id: "media", label: "Photos & documents", icon: Paperclip },
  { id: "notes", label: "Notes", icon: StickyNote },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

const DEFAULT_VALUES: DeviceFormValues = {
  name: "",
  code: "",
  groupId: "",
  status: "storage",
  manufacturerId: "",
  model: "",
  serialNumber: "",
  unitId: "",
  quantity: 1,
  specifications: "",
  source: "",
  importDate: "",
  condition: 100,
  location: "",
  lastCheckDate: "",
  inventoryCycleMonths: 12,
  warrantyStart: "",
  warrantyEnd: "",
  notes: "",
};

interface LookupItem {
  id: string;
  name: string;
}

interface DeviceFormProps {
  mode: "create" | "edit";
  initial?: Partial<DeviceFormValues>;
  device?: { id: string; code: string; name: string; groupIcon: string | null; groupName: string };
  lookups: {
    groups: LookupItem[];
    units: LookupItem[];
    manufacturers: LookupItem[];
  };
}

export function DeviceForm({ mode, initial, device, lookups }: DeviceFormProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const [activeSection, setActiveSection] = useState<SectionId>("general");
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<DeviceFormValues>({
    resolver: zodResolver(deviceFormSchema),
    defaultValues: { ...DEFAULT_VALUES, ...initial },
    mode: "onBlur",
  });
  const { register, handleSubmit, watch, setValue, formState, getValues } = form;
  const createMutation = useCreateDevice();
  const updateMutation = useUpdateDevice();
  const deleteMutation = useDeleteDevice();

  const isDirty = formState.isDirty;
  const dirtyRef = useRef(isDirty);
  dirtyRef.current = isDirty;

  // beforeunload guard
  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (!dirtyRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  // Track active section for the nav rail.
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id as SectionId);
          }
        }
      },
      { rootMargin: "-30% 0px -55% 0px" },
    );
    for (const section of SECTIONS) {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  async function onCancel() {
    if (dirtyRef.current) {
      const ok = await confirm({
        title: "Leave without saving?",
        description: "Unsaved data on this form will be lost.",
        confirmLabel: "Leave",
        tone: "warn",
      });
      if (!ok) return;
    }
    router.push(mode === "edit" && device ? `/devices/${device.code}` : "/devices");
  }

  async function onDelete() {
    if (!device) return;
    const ok = await confirm({
      title: `Delete ${device.name}?`,
      description: "This moves it to the recycle bin. You can restore it later.",
      confirmLabel: "Delete",
      tone: "destructive",
    });
    if (!ok) return;
    try {
      await deleteMutation.mutateAsync(device.id);
      toast.success("Device deleted", { description: "Moved to the recycle bin." });
      setTimeout(() => router.push("/devices"), 600);
    } catch (err) {
      toast.error("Delete failed", {
        description: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async function onSubmit(values: DeviceFormValues) {
    setSubmitting(true);
    try {
      if (mode === "create") {
        try {
          const created = await createMutation.mutateAsync(values);
          toast.success("Device created", {
            description: `${created.name} (${created.code}) is now in the inventory.`,
          });
          form.reset(getValues());
          setTimeout(() => router.push("/devices"), 650);
        } catch (err) {
          toast.error("Save failed", {
            description: err instanceof Error ? err.message : String(err),
          });
        }
      } else if (device) {
        try {
          const updated = await updateMutation.mutateAsync({ id: device.id, values });
          toast.success("Changes saved", {
            description: `${updated.name} has been updated.`,
          });
          form.reset(getValues());
          setTimeout(() => router.push(`/devices/${updated.code}`), 400);
        } catch (err) {
          toast.error("Save failed", {
            description: err instanceof Error ? err.message : String(err),
          });
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  const condition = watch("condition");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <Link
        href={mode === "edit" && device ? `/devices/${device.code}` : "/devices"}
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        {mode === "edit" && device ? "Back to device" : "Back to devices"}
      </Link>

      {mode === "edit" && device ? (
        <div className="flex items-center gap-4">
          <GroupIconTile
            icon={device.groupIcon}
            groupName={device.groupName}
            size="md"
            className="size-12 rounded-xl [&_svg]:size-5"
          />
          <div className="min-w-0">
            <h1 className="text-[22px] font-semibold tracking-[-0.01em]">
              Edit {device.name}
            </h1>
            <div className="font-mono text-[12.5px] text-muted-foreground">{device.code}</div>
          </div>
        </div>
      ) : null}

      <div
        className="grid gap-8 items-start"
        style={{ gridTemplateColumns: "220px minmax(0, 1fr)" }}
      >
        <aside className="sticky top-[74px] self-start hidden min-[1000px]:block">
          <ol className="flex flex-col gap-1">
            {SECTIONS.map((s, i) => {
              const Icon = s.icon;
              const active = activeSection === s.id;
              return (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] transition-colors",
                      active
                        ? "bg-secondary text-secondary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <span className="size-5 rounded-md bg-card ring-1 ring-foreground/10 grid place-items-center text-[10px] font-semibold tabular-nums">
                      {i + 1}
                    </span>
                    <Icon className="size-3.5" aria-hidden />
                    <span>{s.label}</span>
                  </a>
                </li>
              );
            })}
          </ol>
        </aside>

        <div className="flex flex-col gap-5 min-w-0">
          <SectionShell id="general" title="General" icon={Info}>
            <FieldGrid>
              <Field
                label="Device name"
                required
                error={formState.errors.name?.message}
              >
                <Input {...register("name")} placeholder="Dell XPS 15 9530" />
              </Field>
              <Field
                label="Device code"
                required
                error={formState.errors.code?.message}
                hint="Auto-suggested from group (prefix DEV-)"
              >
                <Input {...register("code")} className="font-mono" placeholder="DEV-2041-XPS" />
              </Field>
              <Field label="Group" required error={formState.errors.groupId?.message}>
                <SelectControl
                  value={watch("groupId")}
                  onValueChange={(v) =>
                    setValue("groupId", v, { shouldDirty: true, shouldValidate: true })
                  }
                  placeholder="Choose a group"
                  options={lookups.groups.map((g) => ({ value: g.id, label: g.name }))}
                />
              </Field>
              <Field
                label="Status"
                required
                error={formState.errors.status?.message}
                hint="Alerts (warranty / inventory) are tracked separately."
              >
                <SelectControl
                  value={watch("status")}
                  onValueChange={(v) =>
                    setValue("status", v as DeviceFormValues["status"], {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  options={[
                    { value: "in-use", label: "In use" },
                    { value: "storage", label: "In storage" },
                    { value: "repair", label: "In repair" },
                    { value: "retired", label: "Retired" },
                  ]}
                />
              </Field>
            </FieldGrid>
          </SectionShell>

          <SectionShell id="classification" title="Classification" icon={Tags}>
            <FieldGrid>
              <Field
                label="Manufacturer"
                required
                error={formState.errors.manufacturerId?.message}
              >
                <SelectControl
                  value={watch("manufacturerId")}
                  onValueChange={(v) =>
                    setValue("manufacturerId", v, { shouldDirty: true, shouldValidate: true })
                  }
                  placeholder="Choose a manufacturer"
                  options={lookups.manufacturers.map((m) => ({ value: m.id, label: m.name }))}
                />
              </Field>
              <Field label="Model">
                <Input {...register("model")} placeholder="XPS 15 9530" />
              </Field>
              <Field label="Serial number">
                <Input {...register("serialNumber")} className="font-mono" placeholder="5KQ8R2" />
              </Field>
              <Field label="Unit" required error={formState.errors.unitId?.message}>
                <UnitToggle
                  value={watch("unitId")}
                  units={lookups.units}
                  onChange={(v) =>
                    setValue("unitId", v, { shouldDirty: true, shouldValidate: true })
                  }
                />
              </Field>
              <Field label="Quantity">
                <Input
                  type="number"
                  min={1}
                  {...register("quantity", { valueAsNumber: true })}
                />
              </Field>
              <Field label="Specifications" fullWidth>
                <Textarea
                  {...register("specifications")}
                  placeholder="Intel i7-13700H · 32GB · 1TB SSD · RTX 4050"
                  rows={3}
                />
              </Field>
            </FieldGrid>
          </SectionShell>

          <SectionShell id="lifecycle" title="Lifecycle" icon={Activity}>
            <FieldGrid>
              <Field label="Source">
                <SelectControl
                  value={watch("source") ?? ""}
                  onValueChange={(v) =>
                    setValue("source", v as DeviceFormValues["source"], { shouldDirty: true })
                  }
                  placeholder="Choose a source"
                  options={[
                    { value: "Purchased", label: "Purchased" },
                    { value: "Leased", label: "Leased" },
                    { value: "Donated", label: "Donated" },
                    { value: "Transferred", label: "Transferred" },
                  ]}
                />
              </Field>
              <Field label="Import date">
                <Input type="date" {...register("importDate")} />
              </Field>
              <Field
                label="Condition"
                fullWidth
                hint={`${condition ?? 0}%`}
              >
                <Slider
                  value={[Number(condition ?? 100)]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(v) =>
                    setValue("condition", v[0], { shouldDirty: true, shouldValidate: true })
                  }
                />
              </Field>
              <Field label="Storage position" fullWidth>
                <Input
                  {...register("location")}
                  placeholder="HCMC · Floor 4 · Desk E-12"
                />
              </Field>
              <Field label="Last check date">
                <Input type="date" {...register("lastCheckDate")} />
              </Field>
              <Field label="Inventory cycle (months)">
                <Input
                  type="number"
                  min={1}
                  max={120}
                  {...register("inventoryCycleMonths", { valueAsNumber: true })}
                />
              </Field>
            </FieldGrid>
          </SectionShell>

          <SectionShell id="warranty" title="Warranty" icon={ShieldCheck}>
            <FieldGrid>
              <Field label="Warranty start">
                <Input type="date" {...register("warrantyStart")} />
              </Field>
              <Field
                label="Warranty end"
                error={formState.errors.warrantyEnd?.message}
              >
                <Input type="date" {...register("warrantyEnd")} />
              </Field>
            </FieldGrid>
          </SectionShell>

          <SectionShell id="media" title="Photos & documents" icon={Paperclip}>
            <div className="grid gap-5 md:grid-cols-2">
              <DropzonePlaceholder
                title="Device photos"
                desc="PNG or JPG, up to 5 MB each. The first photo is the cover."
              />
              <DropzonePlaceholder
                title="Documents"
                desc="Invoices, warranty cards, manuals. PDF, DOCX, XLSX, images."
              />
            </div>
            <p className="text-[12px] text-muted-foreground mt-3">
              File uploads aren&apos;t wired up in this build yet — coming soon.
            </p>
          </SectionShell>

          <SectionShell id="notes" title="Notes" icon={StickyNote}>
            <Textarea
              {...register("notes")}
              rows={5}
              placeholder="Anything worth knowing about this device…"
            />
          </SectionShell>
        </div>
      </div>

      <div className="sticky bottom-0 left-0 right-0 z-20 -mx-7 mt-3 px-7 py-3 border-t border-border bg-background/[0.94] backdrop-blur">
        <div className="flex items-center gap-2">
          {mode === "edit" && device ? (
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="size-3.5" aria-hidden />
              Delete device
            </Button>
          ) : null}
          <div className="ml-auto flex items-center gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {mode === "create" ? "Create device" : "Save changes"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

function SectionShell({
  id,
  title,
  icon: Icon,
  children,
}: {
  id: SectionId;
  title: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  children: React.ReactNode;
}) {
  return (
    <Card id={id} className="shadow-none scroll-mt-24 py-0">
      <div className="flex items-center gap-2 px-5 pt-5 pb-3">
        <Icon className="size-3.5 text-muted-foreground" aria-hidden />
        <h2 className="text-[11px] uppercase tracking-[0.08em] font-semibold text-muted-foreground">
          {title}
        </h2>
      </div>
      <div className="px-5 pb-5">{children}</div>
    </Card>
  );
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-5 md:grid-cols-2">{children}</div>;
}

function Field({
  label,
  required,
  hint,
  error,
  fullWidth,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  fullWidth?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5 min-w-0", fullWidth && "md:col-span-2")}>
      <label className="text-[12.5px] font-medium text-foreground">
        {label}
        {required ? <span className="text-destructive ml-0.5">*</span> : null}
      </label>
      {children}
      {error ? (
        <p className="text-[12px] text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-[12px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function SelectControl({
  value,
  onValueChange,
  options,
  placeholder,
}: {
  value: string;
  onValueChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <Select value={value || undefined} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function UnitToggle({
  value,
  units,
  onChange,
}: {
  value: string;
  units: LookupItem[];
  onChange: (v: string) => void;
}) {
  const noneSelected = useMemo(() => !value && units[0]?.id, [value, units]);
  useEffect(() => {
    if (noneSelected) onChange(units[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => {
        if (v) onChange(v);
      }}
      className="justify-start"
    >
      {units.map((u) => (
        <ToggleGroupItem key={u.id} value={u.id} className="text-[12.5px]">
          {u.name}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

function DropzonePlaceholder({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <div className="text-[12.5px] font-medium mb-2">{title}</div>
      <div className="rounded-lg border border-dashed border-border bg-muted/40 p-6 text-center">
        <Upload className="size-5 text-muted-foreground mx-auto mb-2" aria-hidden />
        <div className="text-[12.5px] text-muted-foreground">{desc}</div>
      </div>
    </div>
  );
}
