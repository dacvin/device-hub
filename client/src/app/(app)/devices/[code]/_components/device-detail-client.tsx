"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  CalendarClock,
  Cpu,
  Fingerprint,
  Layers,
  MapPin,
  Pencil,
  Printer,
  ShieldCheck,
  StickyNote,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GroupIconTile } from "@/features/overview/_components/group-icon-tile";
import { StatusBadge } from "@/components/app/status-badge";
import { FlagChipsRow } from "@/components/app/flag-chip";
import { ConditionRing } from "@/components/app/condition-ring";
import { useDeviceByCode } from "@/features/devices/hooks/use-device-by-code";
import { useActivityForEntity } from "@/features/activity/hooks/use-activity";
import { addMonthsISO, daysUntil, formatDate } from "@/lib/format-date";
import { DefinitionList, SectionCard } from "./section-card";
import { DeviceMoreMenu } from "./device-more-menu";
import { DeviceDetailSkeleton } from "./device-detail-skeleton";

export function DeviceDetailClient({ code }: { code: string }) {
  const { data: device, isPending } = useDeviceByCode(code);
  const activity = useActivityForEntity("devices", device?.id);

  if (isPending) return <DeviceDetailSkeleton />;
  if (!device) notFound();

  const nextCheck = addMonthsISO(device.lastCheckDate, device.inventoryCycleMonths);
  const warrantyDays = daysUntil(device.warrantyEnd);

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/devices"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Back to devices
      </Link>

      <div className="flex flex-wrap items-start gap-5">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <GroupIconTile
            icon={device.groupIcon}
            groupName={device.groupName}
            size="md"
            className="size-14 rounded-xl [&_svg]:size-6"
          />
          <div className="min-w-0">
            <h1 className="text-[24px] leading-tight font-semibold tracking-[-0.02em]">
              {device.name}
            </h1>
            <div className="flex items-center gap-2 flex-wrap mt-1.5 text-[12.5px]">
              <span className="font-mono text-muted-foreground">{device.code}</span>
              <span className="h-3 w-px bg-border" aria-hidden />
              <Badge variant="secondary">{device.groupName}</Badge>
              <StatusBadge status={device.status} />
              {device.flags.length > 0 ? (
                <FlagChipsRow flags={device.flags} />
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9" type="button">
            <Printer className="size-3.5" aria-hidden />
            Print label
          </Button>
          <DeviceMoreMenu device={device} />
          <Button asChild size="sm" className="h-9">
            <Link href={`/devices/${device.code}/edit`}>
              <Pencil className="size-3.5" aria-hidden />
              Edit device
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-5 items-start grid-cols-1 min-[1080px]:[grid-template-columns:minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-5 min-w-0">
          <SectionCard title="Identification" icon={Fingerprint}>
            <DefinitionList
              items={[
                { label: "Code", value: device.code, mono: true },
                { label: "Serial number", value: device.serialNumber ?? "—", mono: true },
                { label: "Name", value: device.name },
                { label: "Manufacturer", value: device.manufacturerName ?? "—" },
                { label: "Model", value: device.model ?? "—" },
                { label: "Group", value: device.groupName },
              ]}
            />
          </SectionCard>

          <SectionCard title="Specifications" icon={Cpu}>
            <p className="text-[14px] text-foreground whitespace-pre-wrap">
              {device.specifications || "—"}
            </p>
          </SectionCard>

          <SectionCard title="Allocation" icon={MapPin}>
            <DefinitionList
              items={[
                { label: "Assigned location", value: device.location ?? "—" },
                { label: "Group", value: device.groupName },
                { label: "Unit", value: device.unitName || "—" },
                { label: "Quantity", value: device.quantity },
                { label: "Source", value: device.source ?? "—" },
              ]}
            />
          </SectionCard>

          <SectionCard title="Lifecycle" icon={Activity}>
            <DefinitionList
              items={[
                { label: "Import date", value: formatDate(device.importDate) },
                { label: "Source", value: device.source ?? "—" },
                { label: "Condition", value: `${device.condition}%` },
                {
                  label: "Inventory cycle",
                  value: `${device.inventoryCycleMonths} months`,
                },
                { label: "Last checked", value: formatDate(device.lastCheckDate) },
                { label: "Next check due", value: formatDate(nextCheck) },
              ]}
            />
          </SectionCard>

          <SectionCard title="Warranty" icon={ShieldCheck}>
            <DefinitionList
              items={[
                { label: "Warranty start", value: formatDate(device.warrantyStart) },
                { label: "Warranty end", value: formatDate(device.warrantyEnd) },
                {
                  label: "Coverage",
                  value:
                    warrantyDays === null
                      ? "—"
                      : warrantyDays < 0
                        ? "Expired"
                        : `${warrantyDays} days remaining`,
                },
              ]}
            />
          </SectionCard>

          <SectionCard title="Notes" icon={StickyNote}>
            <p className="text-[14px] text-muted-foreground whitespace-pre-wrap">
              {device.notes || "No notes yet."}
            </p>
          </SectionCard>
        </div>

        <div className="flex flex-col gap-5">
          <Card className="shadow-none gap-0 py-5">
            <div className="flex items-center gap-2 px-5 pb-3">
              <Activity className="size-3.5 text-muted-foreground" aria-hidden />
              <h2 className="text-[11px] uppercase tracking-[0.08em] font-semibold text-muted-foreground">
                Condition
              </h2>
            </div>
            <div className="flex items-center gap-4 px-5">
              <ConditionRing condition={device.condition} />
              <div className="min-w-0">
                <div className="text-[13px] font-medium">
                  {device.condition >= 70
                    ? "Good condition"
                    : device.condition >= 40
                      ? "Fair condition"
                      : "Poor condition"}
                </div>
                <div className="text-[12px] text-muted-foreground mt-1">
                  Last assessed {formatDate(device.lastCheckDate)}
                </div>
              </div>
            </div>
          </Card>

          <Card className="shadow-none gap-0 py-5">
            <ul className="flex flex-col">
              <QuickStat
                icon={ShieldCheck}
                label="Warranty"
                value={
                  warrantyDays === null
                    ? "—"
                    : warrantyDays < 0
                      ? `Expired ${formatDate(device.warrantyEnd)}`
                      : `${warrantyDays} days left · ends ${formatDate(device.warrantyEnd)}`
                }
              />
              <QuickStat
                icon={CalendarClock}
                label="Next inventory"
                value={`Due ${formatDate(nextCheck)}`}
              />
              <QuickStat
                icon={MapPin}
                label="Location"
                value={device.location ?? "—"}
              />
              <QuickStat icon={Layers} label="Group" value={device.groupName} last />
            </ul>
          </Card>

          <Card className="shadow-none gap-0 py-5">
            <div className="flex items-center gap-2 px-5 pb-3">
              <Activity className="size-3.5 text-muted-foreground" aria-hidden />
              <h2 className="text-[11px] uppercase tracking-[0.08em] font-semibold text-muted-foreground">
                Recent activity
              </h2>
            </div>
            {activity.isPending ? (
              <div className="px-5 text-[13px] text-muted-foreground">Loading…</div>
            ) : (activity.data ?? []).length === 0 ? (
              <div className="px-5 text-[13px] text-muted-foreground">
                No activity yet.
              </div>
            ) : (
              <ol className="px-5">
                {(activity.data ?? []).map((a, i, arr) => {
                  const verb =
                    a.action === "insert"
                      ? "Created"
                      : a.action === "delete"
                        ? "Deleted"
                        : a.action === "restore"
                          ? "Restored"
                          : "Updated";
                  return (
                    <li key={a.id} className="relative pl-[26px] pb-[14px] last:pb-0">
                      {i < arr.length - 1 ? (
                        <span
                          className="absolute left-[5px] top-4 bottom-[-2px] w-px bg-border"
                          aria-hidden
                        />
                      ) : null}
                      <span
                        className="absolute left-0 top-1 size-[11px] rounded-full bg-card border-2 border-primary"
                        aria-hidden
                      />
                      <div className="text-[13px] leading-snug">
                        <span className="font-medium">{a.actor_name ?? "Someone"}</span>{" "}
                        {verb.toLowerCase()} this device
                      </div>
                      <div className="text-[11.5px] text-muted-foreground mt-0.5">
                        {formatDate(a.created_at)}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function QuickStat({
  icon: Icon,
  label,
  value,
  last,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <li
      className={`flex items-start gap-3 px-5 py-3 ${last ? "" : "border-b border-border"}`}
    >
      <span className="size-7 rounded-md bg-secondary text-secondary-foreground grid place-items-center shrink-0 mt-0.5">
        <Icon className="size-3.5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[11.5px] text-muted-foreground">{label}</div>
        <div className="text-[13px] mt-0.5 break-words">{value}</div>
      </div>
    </li>
  );
}
