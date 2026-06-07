import { z } from "zod";
import type { Database } from "@/types/database.types";

export type OrgSettingsRow = Database["public"]["Tables"]["org_settings"]["Row"];
export type UserPreferenceRow = Database["public"]["Tables"]["user_preference"]["Row"];

export interface OrgSettings {
  orgName: string;
  primarySite: string | null;
  dateFormat: string;
  codePrefix: string;
  codeAutogenerate: boolean;
  defaultInventoryCycleMonths: number;
  conditionGoodPct: number;
  conditionFairPct: number;
  warrantyExpiringDays: number;
  notifyWarranty: boolean;
  notifyInventoryOverdue: boolean;
  notifyWeeklySummary: boolean;
  notifyNewDevice: boolean;
  exportFormat: "CSV" | "XLSX" | "PDF";
  deletedRetentionDays: number;
  updatedBy: string | null;
  updatedAt: string;
}

export interface UserPreference {
  userId: string;
  theme: "light" | "dark" | "system";
  defaultDeviceView: "table" | "cards";
  monoCodes: boolean;
  updatedAt: string;
}

export function mapOrgSettingsRow(row: OrgSettingsRow): OrgSettings {
  return {
    orgName: row.org_name,
    primarySite: row.primary_site,
    dateFormat: row.date_format,
    codePrefix: row.code_prefix,
    codeAutogenerate: row.code_autogenerate,
    defaultInventoryCycleMonths: row.default_inventory_cycle_months,
    conditionGoodPct: row.condition_good_pct,
    conditionFairPct: row.condition_fair_pct,
    warrantyExpiringDays: row.warranty_expiring_days,
    notifyWarranty: row.notify_warranty,
    notifyInventoryOverdue: row.notify_inventory_overdue,
    notifyWeeklySummary: row.notify_weekly_summary,
    notifyNewDevice: row.notify_new_device,
    exportFormat: row.export_format as OrgSettings["exportFormat"],
    deletedRetentionDays: row.deleted_retention_days,
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
  };
}

export function mapUserPreferenceRow(row: UserPreferenceRow): UserPreference {
  return {
    userId: row.user_id,
    theme: row.theme as UserPreference["theme"],
    defaultDeviceView: row.default_device_view as UserPreference["defaultDeviceView"],
    monoCodes: row.mono_codes,
    updatedAt: row.updated_at,
  };
}

export const orgSettingsSchema = z.object({
  orgName: z.string().min(1).max(120),
  primarySite: z.string().max(120).nullable(),
  dateFormat: z.string().min(1),
  codePrefix: z.string().min(1).max(16),
  codeAutogenerate: z.boolean(),
  defaultInventoryCycleMonths: z.number().int().min(1).max(120),
  conditionGoodPct: z.number().int().min(0).max(100),
  conditionFairPct: z.number().int().min(0).max(100),
  warrantyExpiringDays: z.number().int().min(1).max(365),
  notifyWarranty: z.boolean(),
  notifyInventoryOverdue: z.boolean(),
  notifyWeeklySummary: z.boolean(),
  notifyNewDevice: z.boolean(),
  exportFormat: z.enum(["CSV", "XLSX", "PDF"]),
  deletedRetentionDays: z.number().int().min(0).max(3650),
}).refine(v => v.conditionFairPct <= v.conditionGoodPct, {
  message: "Fair threshold must be ≤ Good threshold",
  path: ["conditionFairPct"],
});

export type OrgSettingsInput = z.infer<typeof orgSettingsSchema>;

export const userPreferenceSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  defaultDeviceView: z.enum(["table", "cards"]),
  monoCodes: z.boolean(),
});

export type UserPreferenceInput = z.infer<typeof userPreferenceSchema>;
