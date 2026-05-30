"use client";

/* eslint-disable react/no-children-prop */

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm, type AnyFieldApi } from "@tanstack/react-form";
import { ArrowLeft, Cpu, Fingerprint, Gauge, Paperclip, ShieldCheck, StickyNote, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/app/page-header";
import { GroupIcon } from "@/components/app/group-icon";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  DEVICE_STATUSES,
  SOURCES,
  STATUS_LABEL,
  UNITS,
  deviceFormSchema,
  type Department,
  type DeviceFormValues,
  type DeviceGroup,
  type Manufacturer,
} from "@/lib/domain/devices";
import {
  createDeviceAction,
  deleteDeviceAction,
  insertDocumentsAction,
  insertPhotosAction,
  removeDocumentAction,
  removePhotoAction,
  reorderPhotosAction,
  updateDeviceAction,
} from "@/app/(app)/devices/_actions";
import {
  PhotoGallery,
  type PhotoItem,
} from "@/app/(app)/devices/_components/photo-gallery";
import {
  DocumentList,
  type DocumentItem,
} from "@/app/(app)/devices/_components/document-list";

const PHOTO_BUCKET = "device-photos";
const DOC_BUCKET = "device-documents";

const SECTIONS = [
  { id: "general", number: "01", label: "General", icon: Fingerprint },
  { id: "classification", number: "02", label: "Classification", icon: Cpu },
  { id: "lifecycle", number: "03", label: "Lifecycle", icon: Gauge },
  { id: "warranty", number: "04", label: "Warranty", icon: ShieldCheck },
  { id: "uploads", number: "05", label: "Photos & documents", icon: Paperclip },
  { id: "notes", number: "06", label: "Notes", icon: StickyNote },
] as const;

interface DeviceFormProps {
  mode: "create" | "edit";
  deviceId?: string;
  initialValues: DeviceFormValues;
  initialPhotos: PhotoItem[];
  initialDocuments: DocumentItem[];
  groups: DeviceGroup[];
  departments: Department[];
  manufacturers: Manufacturer[];
  pageTitle: string;
  pageSubtitle?: string;
}

export function DeviceForm(props: DeviceFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [activeSection, setActiveSection] = useState<string>("general");

  const [photos, setPhotos] = useState<PhotoItem[]>(props.initialPhotos);
  const [documents, setDocuments] = useState<DocumentItem[]>(props.initialDocuments);
  const originalPhotoOrder = useMemo(
    () => props.initialPhotos.map((p) => p.dbId).filter(Boolean) as string[],
    [props.initialPhotos]
  );

  const form = useForm({
    defaultValues: props.initialValues,
    validators: {
      onSubmit: deviceFormSchema,
    },
    onSubmit: async ({ value }) => {
      startTransition(async () => {
        try {
          const action =
            props.mode === "create"
              ? await createDeviceAction(value)
              : await updateDeviceAction(props.deviceId!, value);
          if (!action.ok) {
            toast.error(action.error ?? "Could not save device");
            return;
          }
          const deviceId = action.deviceId!;
          const code = action.code!;
          await persistUploads(deviceId);
          toast.success(props.mode === "create" ? "Device created" : "Device updated");
          router.push(`/devices/${encodeURIComponent(code)}`);
          router.refresh();
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Save failed");
        }
      });
    },
  });

  async function persistUploads(deviceId: string) {
    const supabase = createClient();

    // Upload pending photos.
    const newPhotos: {
      url: string;
      fileName: string | null;
      sizeBytes: number | null;
      sortOrder: number;
    }[] = [];
    for (let i = 0; i < photos.length; i++) {
      const p = photos[i];
      if (!p.file) continue;
      const ext = p.file.name.split(".").pop() ?? "bin";
      const path = `${deviceId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(path, p.file, { contentType: p.file.type });
      if (error) throw new Error(`Photo upload failed: ${error.message}`);
      newPhotos.push({
        url: path,
        fileName: p.fileName,
        sizeBytes: p.sizeBytes,
        sortOrder: i,
      });
    }
    if (newPhotos.length > 0) {
      await insertPhotosAction(deviceId, newPhotos);
    }

    // Reorder persisted photos that moved.
    const persistedOrder = photos
      .map((p, idx) => (p.dbId ? { id: p.dbId, sortOrder: idx } : null))
      .filter((x): x is { id: string; sortOrder: number } => x !== null);
    const orderChanged = persistedOrder.some((p, idx) => p.id !== originalPhotoOrder[idx]);
    if (orderChanged && persistedOrder.length > 0) {
      await reorderPhotosAction(persistedOrder);
    }

    // Upload pending documents.
    const newDocs: {
      url: string;
      fileName: string;
      mimeType: string | null;
      sizeBytes: number | null;
    }[] = [];
    for (const d of documents) {
      if (!d.file) continue;
      const ext = d.file.name.split(".").pop() ?? "bin";
      const path = `${deviceId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from(DOC_BUCKET)
        .upload(path, d.file, { contentType: d.file.type });
      if (error) throw new Error(`Document upload failed: ${error.message}`);
      newDocs.push({
        url: path,
        fileName: d.fileName,
        mimeType: d.mimeType,
        sizeBytes: d.sizeBytes,
      });
    }
    if (newDocs.length > 0) {
      await insertDocumentsAction(deviceId, newDocs);
    }
  }

  // Scrollspy
  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    if (els.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { rootMargin: "-25% 0px -55% 0px", threshold: [0.1, 0.5, 1] }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <PageHeader title={props.pageTitle} subtitle={props.pageSubtitle} />

      <Link
        href="/devices"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="size-4" /> Back to devices
      </Link>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="grid grid-cols-1 xl:grid-cols-[220px_1fr] gap-6 pb-24"
      >
        <aside className="hidden xl:block">
          <div className="sticky top-20 space-y-1">
            {SECTIONS.map((s) => {
              const active = activeSection === s.id;
              return (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                    active
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground"
                  )}
                >
                  <span className="text-[10px] font-mono">{s.number}</span>
                  <span>{s.label}</span>
                </a>
              );
            })}
          </div>
        </aside>

        <div className="space-y-4 min-w-0">
          {/* General */}
          <Card id="general" className="p-6 scroll-mt-20">
            <SectionHeader number="01" label="General" description="Identity and ownership of the device." icon={Fingerprint} />
            <FieldGroup>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <form.Field
                  name="name"
                  children={(field) => (
                    <FieldWrap field={field}>
                      <FieldLabel htmlFor={field.name}>
                        Device name <Required />
                      </FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. Dell XPS 15 9530"
                        aria-invalid={isInvalid(field)}
                      />
                      <FieldError errors={errs(field)} />
                    </FieldWrap>
                  )}
                />
                <form.Field
                  name="code"
                  children={(field) => (
                    <FieldWrap field={field}>
                      <FieldLabel htmlFor={field.name}>
                        Device code <Required />
                      </FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="DEV-0000-XXX"
                        className="font-mono"
                        aria-invalid={isInvalid(field)}
                      />
                      <FieldDescription>Unique. Auto-suggested from group.</FieldDescription>
                      <FieldError errors={errs(field)} />
                    </FieldWrap>
                  )}
                />
                <form.Field
                  name="groupId"
                  children={(field) => (
                    <FieldWrap field={field}>
                      <FieldLabel htmlFor={field.name}>
                        Group <Required />
                      </FieldLabel>
                      <Select
                        value={field.state.value || undefined}
                        onValueChange={(v) => field.handleChange(v)}
                      >
                        <SelectTrigger id={field.name} aria-invalid={isInvalid(field)}>
                          <SelectValue placeholder="Select…" />
                        </SelectTrigger>
                        <SelectContent>
                          {props.groups.map((g) => (
                            <SelectItem key={g.id} value={g.id}>
                              <span className="inline-flex items-center gap-2">
                                <GroupIcon icon={g.icon} size="sm" />
                                {g.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError errors={errs(field)} />
                    </FieldWrap>
                  )}
                />
                <form.Field
                  name="departmentId"
                  children={(field) => (
                    <FieldWrap field={field}>
                      <FieldLabel htmlFor={field.name}>
                        Department <Required />
                      </FieldLabel>
                      <Select
                        value={field.state.value || undefined}
                        onValueChange={(v) => field.handleChange(v)}
                      >
                        <SelectTrigger id={field.name} aria-invalid={isInvalid(field)}>
                          <SelectValue placeholder="Select…" />
                        </SelectTrigger>
                        <SelectContent>
                          {props.departments.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError errors={errs(field)} />
                    </FieldWrap>
                  )}
                />
              </div>
            </FieldGroup>
          </Card>

          {/* Classification */}
          <Card id="classification" className="p-6 scroll-mt-20">
            <SectionHeader number="02" label="Classification" description="Make, model and technical detail." icon={Cpu} />
            <FieldGroup>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <form.Field
                  name="manufacturerId"
                  children={(field) => (
                    <FieldWrap field={field}>
                      <FieldLabel htmlFor={field.name}>Manufacturer</FieldLabel>
                      <Select
                        value={field.state.value || undefined}
                        onValueChange={(v) => field.handleChange(v)}
                      >
                        <SelectTrigger id={field.name}>
                          <SelectValue placeholder="Select…" />
                        </SelectTrigger>
                        <SelectContent>
                          {props.manufacturers.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError errors={errs(field)} />
                    </FieldWrap>
                  )}
                />
                <form.Field
                  name="model"
                  children={(field) => (
                    <FieldWrap field={field}>
                      <FieldLabel htmlFor={field.name}>Model</FieldLabel>
                      <Input
                        id={field.name}
                        value={field.state.value ?? ""}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                    </FieldWrap>
                  )}
                />
                <form.Field
                  name="serialNumber"
                  children={(field) => (
                    <FieldWrap field={field}>
                      <FieldLabel htmlFor={field.name}>Serial number</FieldLabel>
                      <Input
                        id={field.name}
                        className="font-mono"
                        value={field.state.value ?? ""}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                    </FieldWrap>
                  )}
                />
                <div className="grid grid-cols-[1fr_140px] gap-3">
                  <form.Field
                    name="quantity"
                    children={(field) => (
                      <FieldWrap field={field}>
                        <FieldLabel htmlFor={field.name}>Quantity</FieldLabel>
                        <Input
                          id={field.name}
                          type="number"
                          min={1}
                          value={field.state.value as unknown as number}
                          onChange={(e) => field.handleChange(Number(e.target.value))}
                          aria-invalid={isInvalid(field)}
                        />
                        <FieldError errors={errs(field)} />
                      </FieldWrap>
                    )}
                  />
                  <form.Field
                    name="unit"
                    children={(field) => (
                      <FieldWrap field={field}>
                        <FieldLabel>Unit</FieldLabel>
                        <ToggleGroup
                          type="single"
                          variant="outline"
                          size="sm"
                          value={field.state.value}
                          onValueChange={(v) => v && field.handleChange(v as DeviceFormValues["unit"])}
                          className="h-9"
                        >
                          {UNITS.map((u) => (
                            <ToggleGroupItem key={u} value={u} className="capitalize text-xs">
                              {u}
                            </ToggleGroupItem>
                          ))}
                        </ToggleGroup>
                      </FieldWrap>
                    )}
                  />
                </div>
              </div>
              <form.Field
                name="specifications"
                children={(field) => (
                  <FieldWrap field={field}>
                    <FieldLabel htmlFor={field.name}>Specifications</FieldLabel>
                    <Textarea
                      id={field.name}
                      rows={4}
                      value={field.state.value ?? ""}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="CPU, RAM, storage, OS, accessories…"
                    />
                  </FieldWrap>
                )}
              />
            </FieldGroup>
          </Card>

          {/* Lifecycle */}
          <Card id="lifecycle" className="p-6 scroll-mt-20">
            <SectionHeader number="03" label="Lifecycle" description="Status, condition and inventory cadence." icon={Gauge} />
            <FieldGroup>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <form.Field
                  name="status"
                  children={(field) => (
                    <FieldWrap field={field}>
                      <FieldLabel htmlFor={field.name}>Status</FieldLabel>
                      <Select
                        value={field.state.value}
                        onValueChange={(v) => field.handleChange(v as DeviceFormValues["status"])}
                      >
                        <SelectTrigger id={field.name}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DEVICE_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {STATUS_LABEL[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FieldWrap>
                  )}
                />
                <form.Field
                  name="source"
                  children={(field) => (
                    <FieldWrap field={field}>
                      <FieldLabel htmlFor={field.name}>Source</FieldLabel>
                      <Select
                        value={field.state.value ?? undefined}
                        onValueChange={(v) => field.handleChange(v as DeviceFormValues["source"])}
                      >
                        <SelectTrigger id={field.name}>
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          {SOURCES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FieldWrap>
                  )}
                />
                <form.Field
                  name="location"
                  children={(field) => (
                    <FieldWrap field={field}>
                      <FieldLabel htmlFor={field.name}>Storage location</FieldLabel>
                      <Input
                        id={field.name}
                        value={field.state.value ?? ""}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="e.g. HCMC · Floor 4 · Desk E-12"
                      />
                    </FieldWrap>
                  )}
                />
                <form.Field
                  name="importDate"
                  children={(field) => (
                    <FieldWrap field={field}>
                      <FieldLabel htmlFor={field.name}>Import date</FieldLabel>
                      <Input
                        id={field.name}
                        type="date"
                        value={field.state.value ?? ""}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                    </FieldWrap>
                  )}
                />
                <form.Field
                  name="lastCheckDate"
                  children={(field) => (
                    <FieldWrap field={field}>
                      <FieldLabel htmlFor={field.name}>Last inventory check</FieldLabel>
                      <Input
                        id={field.name}
                        type="date"
                        value={field.state.value ?? ""}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                    </FieldWrap>
                  )}
                />
                <form.Field
                  name="inventoryCycleMonths"
                  children={(field) => (
                    <FieldWrap field={field}>
                      <FieldLabel htmlFor={field.name}>Inventory cycle (months)</FieldLabel>
                      <Input
                        id={field.name}
                        type="number"
                        min={1}
                        max={120}
                        value={field.state.value as unknown as number}
                        onChange={(e) => field.handleChange(Number(e.target.value))}
                      />
                    </FieldWrap>
                  )}
                />
              </div>
              <form.Field
                name="condition"
                children={(field) => (
                  <FieldWrap field={field}>
                    <div className="flex items-center justify-between">
                      <FieldLabel htmlFor={field.name}>Condition</FieldLabel>
                      <span className="text-sm font-medium tabular-nums">
                        {field.state.value}%
                      </span>
                    </div>
                    <Slider
                      id={field.name}
                      min={0}
                      max={100}
                      step={1}
                      value={[field.state.value]}
                      onValueChange={(v) => field.handleChange(v[0])}
                    />
                    <FieldDescription>
                      0% = unusable · 100% = brand new.
                    </FieldDescription>
                  </FieldWrap>
                )}
              />
            </FieldGroup>
          </Card>

          {/* Warranty */}
          <Card id="warranty" className="p-6 scroll-mt-20">
            <SectionHeader number="04" label="Warranty" description="Coverage window." icon={ShieldCheck} />
            <FieldGroup>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <form.Field
                  name="warrantyStart"
                  children={(field) => (
                    <FieldWrap field={field}>
                      <FieldLabel htmlFor={field.name}>Warranty start</FieldLabel>
                      <Input
                        id={field.name}
                        type="date"
                        value={field.state.value ?? ""}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                    </FieldWrap>
                  )}
                />
                <form.Field
                  name="warrantyEnd"
                  children={(field) => (
                    <FieldWrap field={field}>
                      <FieldLabel htmlFor={field.name}>Warranty end</FieldLabel>
                      <Input
                        id={field.name}
                        type="date"
                        value={field.state.value ?? ""}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid(field)}
                      />
                      <FieldError errors={errs(field)} />
                    </FieldWrap>
                  )}
                />
              </div>
            </FieldGroup>
          </Card>

          {/* Uploads */}
          <Card id="uploads" className="p-6 scroll-mt-20">
            <SectionHeader number="05" label="Photos & documents" description="A device photo and any supporting files." icon={Paperclip} />
            <FieldGroup>
              <FieldSet>
                <FieldLegend>Device photos</FieldLegend>
                <PhotoGallery
                  items={photos}
                  onChange={setPhotos}
                  onRemovePersisted={async (item) => {
                    if (item.dbId && item.storagePath) {
                      await removePhotoAction(item.dbId, item.storagePath);
                    }
                  }}
                />
              </FieldSet>
              <FieldSet>
                <FieldLegend>Documents</FieldLegend>
                <DocumentList
                  items={documents}
                  onChange={setDocuments}
                  onRemovePersisted={async (item) => {
                    if (item.dbId && item.storagePath) {
                      await removeDocumentAction(item.dbId, item.storagePath);
                    }
                  }}
                />
              </FieldSet>
            </FieldGroup>
          </Card>

          {/* Notes */}
          <Card id="notes" className="p-6 scroll-mt-20">
            <SectionHeader number="06" label="Notes" description="Free-form context." icon={StickyNote} />
            <form.Field
              name="notes"
              children={(field) => (
                <Textarea
                  rows={4}
                  value={field.state.value ?? ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Anything else worth remembering…"
                />
              )}
            />
          </Card>
        </div>

        {/* Action bar */}
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/95 backdrop-blur">
          <div className="max-w-[1320px] mx-auto px-7 py-3 flex items-center justify-between gap-3 lg:pl-[280px]">
            <div>
              {props.mode === "edit" && props.deviceId && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" type="button">
                      <Trash2 className="size-4" /> Delete device
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this device?</AlertDialogTitle>
                      <AlertDialogDescription>
                        The device will be soft-deleted and removed from lists. Catalog records remain.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          startTransition(async () => {
                            await deleteDeviceAction(props.deviceId!);
                          });
                        }}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/devices">Cancel</Link>
              </Button>
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? "Saving…" : props.mode === "create" ? "Create device" : "Save changes"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}

function SectionHeader({
  number,
  label,
  description,
  icon: Icon,
}: {
  number: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="size-9 rounded-md bg-secondary text-secondary-foreground flex items-center justify-center shrink-0">
        <Icon className="size-4" />
      </div>
      <div>
        <h3 className="text-base font-semibold tracking-tight">
          <span className="text-[10px] font-mono text-muted-foreground mr-2 align-middle">{number}</span>
          {label}
        </h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function Required() {
  return <span className="text-destructive">*</span>;
}

function isInvalid(field: AnyFieldApi): boolean {
  return field.state.meta.isTouched && !field.state.meta.isValid;
}

function errs(field: AnyFieldApi): { message: string }[] {
  return field.state.meta.errors
    .filter((e: unknown) => e != null)
    .map((e: unknown) => {
      if (typeof e === "string") return { message: e };
      if (e && typeof e === "object" && "message" in e) {
        return { message: String((e as { message: unknown }).message) };
      }
      return { message: String(e) };
    });
}

function FieldWrap({
  field,
  children,
}: {
  field: AnyFieldApi;
  children: React.ReactNode;
}) {
  return <Field data-invalid={isInvalid(field)}>{children}</Field>;
}
