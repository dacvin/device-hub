import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  ClipboardCheck,
  Cpu,
  Fingerprint,
  Gauge,
  History,
  MapPin,
  MoreHorizontal,
  Pencil,
  Printer,
  ShieldCheck,
  StickyNote,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  getDeviceWithFlagsByCode,
  listDeviceDocuments,
  listDevicePhotos,
} from "@/lib/data/devices";
import { getGroupById } from "@/lib/data/groups";
import { getDepartmentById } from "@/lib/data/departments";
import { getManufacturerById } from "@/lib/data/manufacturers";
import { signedPhotoUrls, signedDocumentUrls } from "@/lib/data/storage";
import { GroupIcon } from "@/components/app/group-icon";
import { StatusBadge } from "@/components/app/status-badge";
import { FlagChip } from "@/components/app/flag-chip";
import { ConditionRing } from "@/components/app/condition-ring";
import { PageHeader } from "@/components/app/page-header";
import { formatBytes } from "@/lib/domain/devices";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function DeviceDetailsPage({ params }: PageProps) {
  const { code } = await params;
  const decodedCode = decodeURIComponent(code);
  const device = await getDeviceWithFlagsByCode(decodedCode);
  if (!device) notFound();

  const [group, dept, mfr, photos, documents] = await Promise.all([
    getGroupById(device.groupId),
    getDepartmentById(device.departmentId),
    device.manufacturerId ? getManufacturerById(device.manufacturerId) : null,
    listDevicePhotos(device.id),
    listDeviceDocuments(device.id),
  ]);

  const photoUrlMap = await signedPhotoUrls(photos.map((p) => p.url));
  const docUrlMap = await signedDocumentUrls(documents.map((d) => d.url));

  const t = await getTranslations("devices.details");
  const tSource = await getTranslations("devices.source");
  const tUnit = await getTranslations("devices.unit");

  const now = new Date();
  const warrantyDaysLeft = device.warrantyEnd
    ? Math.ceil(
        (new Date(device.warrantyEnd).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
    : null;

  const nextInventoryDue = device.lastCheckDate
    ? new Date(
        new Date(device.lastCheckDate).setMonth(
          new Date(device.lastCheckDate).getMonth() + device.inventoryCycleMonths
        )
      )
    : null;

  return (
    <>
      <PageHeader title={t("pageTitle")} />

      <Link
        href="/devices"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="size-[15px]" /> {t("backToDevices")}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-[18px] mb-[22px]">
        <div className="flex items-start gap-[18px] min-w-0">
          <GroupIcon icon={group?.icon ?? null} size="lg" />
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold tracking-tight leading-tight">{device.name}</h2>
            <div className="flex flex-wrap items-center gap-2.5 mt-1.5">
              <span className="font-mono text-[13px] text-muted-foreground">{device.code}</span>
              <span className="inline-block h-[14px] w-px bg-border" aria-hidden />
              {group && <Badge variant="secondary">{group.name}</Badge>}
              <StatusBadge status={device.status} />
              {device.flags.map((f) => (
                <FlagChip key={f} flag={f} />
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="lg"
            className="hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent"
          >
            <Printer className="size-4" /> {t("printLabel")}
          </Button>
          <Button
            variant="outline"
            size="icon-lg"
            className="hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent"
          >
            <MoreHorizontal className="size-4" />
          </Button>
          <Button size="lg" asChild>
            <Link href={`/devices/${encodeURIComponent(device.code)}/edit`}>
              <Pencil className="size-4" /> {t("editDevice")}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 [@media(min-width:1080px)]:grid-cols-[1fr_320px] gap-5 items-start">
        <div className="space-y-5 min-w-0">
          <SectionCard icon={<Fingerprint className="size-[15px] text-primary" />} title={t("sectionIdentification")}>
            <DefList
              items={[
                [t("fieldCode"), <span key="code" className="font-mono font-normal">{device.code}</span>],
                [t("fieldSerial"), <span key="serial" className="font-mono font-normal">{device.serialNumber ?? "—"}</span>],
                [t("fieldName"), device.name],
                [t("fieldManufacturer"), mfr?.name ?? "—"],
                [t("fieldModel"), device.model ?? "—"],
                [t("fieldGroup"), group?.name ?? "—"],
              ]}
            />
          </SectionCard>

          <SectionCard icon={<Cpu className="size-[15px] text-primary" />} title={t("sectionSpecifications")}>
            <div className="mt-[18px] text-sm whitespace-pre-wrap leading-relaxed">
              {device.specifications || (
                <span className="text-muted-foreground">{t("noSpecifications")}</span>
              )}
            </div>
          </SectionCard>

          <SectionCard icon={<ClipboardCheck className="size-[15px] text-primary" />} title={t("sectionAllocation")}>
            <DefList
              items={[
                [t("fieldDepartment"), dept?.name ?? "—"],
                [t("fieldLocation"), device.location ?? "—"],
                [t("fieldQuantity"), `${device.quantity} ${tUnit(device.unit)}`],
                [t("fieldSource"), device.source ? tSource(device.source) : "—"],
              ]}
            />
          </SectionCard>

          <SectionCard icon={<Gauge className="size-[15px] text-primary" />} title={t("sectionLifecycle")}>
            <DefList
              items={[
                [t("fieldStatus"), <StatusBadge key="status" status={device.status} />],
                [t("fieldCondition"), `${device.condition}%`],
                [t("fieldImportDate"), formatDate(device.importDate)],
                [t("fieldLastCheck"), formatDate(device.lastCheckDate)],
                [t("fieldInventoryCycle"), `${device.inventoryCycleMonths} ${t("fieldInventoryCycleSuffix")}`],
              ]}
            />
          </SectionCard>

          <SectionCard icon={<ShieldCheck className="size-[15px] text-primary" />} title={t("sectionWarranty")}>
            <DefList
              items={[
                [t("fieldWarrantyStart"), formatDate(device.warrantyStart)],
                [t("fieldWarrantyEnd"), formatDate(device.warrantyEnd)],
                [
                  t("fieldDaysLeft"),
                  warrantyDaysLeft === null
                    ? "—"
                    : warrantyDaysLeft < 0
                      ? t("warrantyExpired")
                      : `${warrantyDaysLeft} days`,
                ],
              ]}
            />
          </SectionCard>

          <SectionCard icon={<StickyNote className="size-[15px] text-primary" />} title={t("sectionNotes")}>
            <div className="mt-[18px] text-sm whitespace-pre-wrap leading-relaxed text-muted-foreground">
              {device.notes || <span>{t("noNotes")}</span>}
            </div>
          </SectionCard>

          {photos.length > 0 && (
            <SectionCard
              icon={<Cpu className="size-[15px] text-primary" />}
              title={t("photosWithCount", { count: photos.length })}
            >
              <div className="grid grid-cols-4 gap-2">
                {photos.map((p) => {
                  const src = photoUrlMap[p.url];
                  return (
                    <div
                      key={p.id}
                      className="relative aspect-square rounded-md overflow-hidden border border-border bg-muted"
                    >
                      {src && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={src} alt={p.fileName ?? ""} className="size-full object-cover" />
                      )}
                      {p.sortOrder === 0 && (
                        <span className="absolute top-1 left-1 text-[10px] font-medium bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                          {t("photoCover")}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          )}

          {documents.length > 0 && (
            <SectionCard
              icon={<ClipboardCheck className="size-[15px] text-primary" />}
              title={t("documentsWithCount", { count: documents.length })}
            >
              <ul className="divide-y divide-border">
                {documents.map((d) => {
                  const href = docUrlMap[d.url];
                  return (
                    <li key={d.id} className="py-2 flex items-center gap-3">
                      <div className="size-9 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                        <StickyNote className="size-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate">{d.fileName}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatBytes(d.sizeBytes)}
                        </div>
                      </div>
                      {href && (
                        <a
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          {t("openDocument")}
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </SectionCard>
          )}
        </div>

        <aside className="space-y-5">
          <Card className="p-[22px]">
            <SectionTitle icon={<Gauge className="size-[15px] text-primary" />} title={t("conditionCardTitle")} />
            <div className="mt-4 flex items-center gap-4">
              <ConditionRing value={device.condition} />
            </div>
          </Card>

          <Card className="px-[22px] py-2">
            <RailStat
              icon={<ShieldCheck className="size-[17px]" />}
              label={t("warrantyTitle")}
              value={
                warrantyDaysLeft === null
                  ? "—"
                  : warrantyDaysLeft < 0
                    ? t("warrantyExpired")
                    : `${warrantyDaysLeft} days left`
              }
            />
            <RailStat
              icon={<CalendarClock className="size-[17px]" />}
              label={t("nextInventoryTitle")}
              value={nextInventoryDue ? formatDate(nextInventoryDue.toISOString()) : "—"}
            />
            <RailStat
              icon={<MapPin className="size-[17px]" />}
              label={t("fieldLocation")}
              value={device.location ?? "—"}
            />
            <RailStat
              icon={<MapPin className="size-[17px]" />}
              label={t("fieldDepartment")}
              value={dept?.name ?? "—"}
            />
          </Card>

          <Card className="p-[22px]">
            <SectionTitle icon={<History className="size-[15px] text-primary" />} title={t("recentActivityCardTitle")} />
            <ul className="relative mt-[18px] flex flex-col">
              <TimelineItem
                icon={<Pencil className="size-[13px]" />}
                title={t("lastUpdateTitle")}
                time={formatDate(device.updatedAt)}
              />
              <TimelineItem
                icon={<MapPin className="size-[13px]" />}
                title={t("lastInventoryCheckTitle")}
                time={formatDate(device.lastCheckDate)}
              />
              <TimelineItem
                icon={<ShieldCheck className="size-[13px]" />}
                title={t("createdTitle")}
                time={formatDate(device.createdAt)}
                last
              />
            </ul>
          </Card>
        </aside>
      </div>
    </>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.04em] text-muted-foreground">
      {icon}
      {title}
    </div>
  );
}

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-[22px]">
      <SectionTitle icon={icon} title={title} />
      {children}
    </Card>
  );
}

function DefList({
  items,
}: {
  items: [string, React.ReactNode][];
}) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-7 gap-y-[18px] mt-[18px]">
      {items.map(([k, v], i) => (
        <div key={i}>
          <dt className="text-xs text-muted-foreground">{k}</dt>
          <dd className="text-sm font-medium mt-[3px]">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function RailStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-[14px] border-b border-border last:border-b-0">
      <span className="inline-flex size-[34px] shrink-0 items-center justify-center rounded-[9px] bg-muted text-muted-foreground">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-medium mt-px">{value}</div>
      </div>
    </div>
  );
}

function TimelineItem({
  icon,
  title,
  time,
  last = false,
}: {
  icon: React.ReactNode;
  title: string;
  time: string;
  last?: boolean;
}) {
  return (
    <li className={`relative flex gap-3 ${last ? "" : "pb-[18px]"}`}>
      {!last && (
        <span
          className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-border"
          aria-hidden
        />
      )}
      <span className="relative z-10 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground mt-px">{time}</div>
      </div>
    </li>
  );
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}
