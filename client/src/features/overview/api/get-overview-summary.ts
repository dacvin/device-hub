import { createClient } from "@/lib/supabase/client";
import {
  deviceFlags,
  type DeviceFlag,
  type DeviceStatus,
} from "@/lib/domain/devices";

export interface OverviewFlaggedDevice {
  id: string;
  code: string;
  name: string;
  status: DeviceStatus;
  groupName: string;
  groupIcon: string | null;
  flags: DeviceFlag[];
}

export interface OverviewSummary {
  totalDevices: number;
  totalQuantity: number;
  totalGroups: number;
  groupCount: number;
  byStatus: Record<DeviceStatus, number>;
  byGroup: { name: string; icon: string | null; count: number }[];
  flaggedDevices: OverviewFlaggedDevice[];
  flaggedCount: number;
  avgCondition: number;
  inRepairCount: number;
}

export async function getOverviewSummary(): Promise<OverviewSummary> {
  const supabase = createClient();

  const [devicesQ, groupsQ] = await Promise.all([
    supabase
      .from("devices")
      .select(
        `id, code, name, status, quantity, condition,
         warranty_end, last_check_date, inventory_cycle_months,
         group:group_id(name, icon)`,
      )
      .is("deleted_at", null),
    supabase.from("groups").select("id, name").is("deleted_at", null),
  ]);

  if (devicesQ.error) throw devicesQ.error;
  if (groupsQ.error) throw groupsQ.error;

  type DeviceJoinRow = {
    id: string;
    code: string;
    name: string;
    status: DeviceStatus;
    quantity: number;
    condition: number;
    warranty_end: string | null;
    last_check_date: string | null;
    inventory_cycle_months: number;
    group: { name: string; icon: string | null } | null;
  };

  const today = new Date();
  const rows = (devicesQ.data ?? []) as unknown as DeviceJoinRow[];

  const byStatus: Record<DeviceStatus, number> = {
    "in-use": 0,
    storage: 0,
    repair: 0,
    retired: 0,
  };
  const groupCount: Record<string, number> = {};
  const groupIcon: Record<string, string | null> = {};
  let totalQuantity = 0;
  let conditionSum = 0;
  let conditionN = 0;
  const flagged: OverviewFlaggedDevice[] = [];

  for (const row of rows) {
    byStatus[row.status]++;
    totalQuantity += row.quantity ?? 0;
    if (typeof row.condition === "number") {
      conditionSum += row.condition;
      conditionN++;
    }
    const gName = row.group?.name ?? "Unassigned";
    groupCount[gName] = (groupCount[gName] ?? 0) + 1;
    groupIcon[gName] = row.group?.icon ?? null;

    const flags = deviceFlags(
      {
        status: row.status,
        warranty_end: row.warranty_end,
        last_check_date: row.last_check_date,
        inventory_cycle_months: row.inventory_cycle_months,
      },
      today,
    );
    if (flags.length > 0) {
      flagged.push({
        id: row.id,
        code: row.code,
        name: row.name,
        status: row.status,
        groupName: gName,
        groupIcon: row.group?.icon ?? null,
        flags,
      });
    }
  }

  const byGroup = Object.entries(groupCount)
    .map(([name, count]) => ({ name, icon: groupIcon[name] ?? null, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalDevices: rows.length,
    totalQuantity,
    totalGroups: groupsQ.data?.length ?? 0,
    groupCount: Object.keys(groupCount).length,
    byStatus,
    byGroup,
    flaggedDevices: flagged,
    flaggedCount: flagged.length,
    avgCondition: conditionN > 0 ? Math.round(conditionSum / conditionN) : 0,
    inRepairCount: byStatus.repair,
  };
}
