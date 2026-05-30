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
      <PageHeader title="Device details" />

      <Link
        href="/devices"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="size-4" /> Back to devices
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-4 min-w-0">
          <GroupIcon icon={group?.icon ?? null} size="lg" />
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold tracking-tight leading-tight">{device.name}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="font-mono text-xs text-muted-foreground">{device.code}</span>
              <span className="text-muted-foreground">·</span>
              {group && <Badge variant="secondary">{group.name}</Badge>}
              <StatusBadge status={device.status} />
            </div>
            {device.flags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {device.flags.map((f) => (
                  <FlagChip key={f} flag={f} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm">
            <Printer className="size-4" /> Print label
          </Button>
          <Button variant="outline" size="icon">
            <MoreHorizontal className="size-4" />
          </Button>
          <Button size="sm" asChild>
            <Link href={`/devices/${encodeURIComponent(device.code)}/edit`}>
              <Pencil className="size-4" /> Edit device
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-4 min-w-0">
          <SectionCard icon={<Fingerprint className="size-4 text-primary" />} title="Identification">
            <DefList
              items={[
                ["Code", <span key="code" className="font-mono">{device.code}</span>],
                ["Serial number", <span key="serial" className="font-mono">{device.serialNumber ?? "—"}</span>],
                ["Name", device.name],
                ["Manufacturer", mfr?.name ?? "—"],
                ["Model", device.model ?? "—"],
                ["Group", group?.name ?? "—"],
              ]}
            />
          </SectionCard>

          <SectionCard icon={<Cpu className="size-4 text-primary" />} title="Specifications">
            <div className="text-sm whitespace-pre-wrap leading-relaxed">
              {device.specifications || (
                <span className="text-muted-foreground">No specifications recorded.</span>
              )}
            </div>
          </SectionCard>

          <SectionCard icon={<ClipboardCheck className="size-4 text-primary" />} title="Allocation">
            <DefList
              items={[
                ["Department", dept?.name ?? "—"],
                ["Location", device.location ?? "—"],
                ["Quantity", `${device.quantity} ${device.unit}`],
                ["Source", device.source ?? "—"],
              ]}
            />
          </SectionCard>

          <SectionCard icon={<Gauge className="size-4 text-primary" />} title="Lifecycle">
            <DefList
              items={[
                ["Status", <StatusBadge key="status" status={device.status} />],
                ["Condition", `${device.condition}%`],
                ["Import date", formatDate(device.importDate)],
                ["Last check", formatDate(device.lastCheckDate)],
                ["Inventory cycle", `${device.inventoryCycleMonths} months`],
              ]}
            />
          </SectionCard>

          <SectionCard icon={<ShieldCheck className="size-4 text-primary" />} title="Warranty">
            <DefList
              items={[
                ["Warranty start", formatDate(device.warrantyStart)],
                ["Warranty end", formatDate(device.warrantyEnd)],
                [
                  "Days left",
                  warrantyDaysLeft === null
                    ? "—"
                    : warrantyDaysLeft < 0
                      ? "Expired"
                      : `${warrantyDaysLeft} days`,
                ],
              ]}
            />
          </SectionCard>

          <SectionCard icon={<StickyNote className="size-4 text-primary" />} title="Notes">
            <div className="text-sm whitespace-pre-wrap leading-relaxed">
              {device.notes || <span className="text-muted-foreground">No notes.</span>}
            </div>
          </SectionCard>

          {photos.length > 0 && (
            <SectionCard
              icon={<Cpu className="size-4 text-primary" />}
              title={`Photos (${photos.length})`}
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
                          Cover
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
              icon={<ClipboardCheck className="size-4 text-primary" />}
              title={`Documents (${documents.length})`}
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
                          Open
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </SectionCard>
          )}
        </div>

        <aside className="space-y-4">
          <Card className="p-5">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-3">
              Condition
            </div>
            <div className="flex items-center justify-center">
              <ConditionRing value={device.condition} />
            </div>
          </Card>

          <Card className="p-5">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-3">
              Snapshot
            </div>
            <DefList
              compact
              items={[
                [
                  "Warranty",
                  warrantyDaysLeft === null
                    ? "—"
                    : warrantyDaysLeft < 0
                      ? "Expired"
                      : `${warrantyDaysLeft} days left`,
                ],
                [
                  "Next inventory",
                  nextInventoryDue ? formatDate(nextInventoryDue.toISOString()) : "—",
                ],
                ["Location", device.location ?? "—"],
                ["Department", dept?.name ?? "—"],
              ]}
            />
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <History className="size-4 text-primary" />
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Recent activity
              </div>
            </div>
            <ul className="relative space-y-3 pl-5 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-border">
              <TimelineItem
                icon={<CalendarClock className="size-3" />}
                title="Last update"
                time={formatDate(device.updatedAt)}
              />
              <TimelineItem
                icon={<MapPin className="size-3" />}
                title="Last inventory check"
                time={formatDate(device.lastCheckDate)}
              />
              <TimelineItem
                icon={<ShieldCheck className="size-3" />}
                title="Created"
                time={formatDate(device.createdAt)}
              />
            </ul>
          </Card>
        </aside>
      </div>
    </>
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
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
          {title}
        </div>
      </div>
      {children}
    </Card>
  );
}

function DefList({
  items,
  compact = false,
}: {
  items: [string, React.ReactNode][];
  compact?: boolean;
}) {
  return (
    <dl
      className={
        compact
          ? "grid grid-cols-2 gap-x-3 gap-y-3 text-xs"
          : "grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm"
      }
    >
      {items.map(([k, v], i) => (
        <div key={i}>
          <dt className="text-xs text-muted-foreground">{k}</dt>
          <dd className="font-medium mt-0.5">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function TimelineItem({
  icon,
  title,
  time,
}: {
  icon: React.ReactNode;
  title: string;
  time: string;
}) {
  return (
    <li className="relative">
      <span className="absolute -left-5 top-0.5 size-4 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
        {icon}
      </span>
      <div className="text-sm font-medium">{title}</div>
      <div className="text-xs text-muted-foreground">{time}</div>
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
