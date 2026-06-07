import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  type OrgSettings,
  type UserPreference,
  type OrgSettingsInput,
  type UserPreferenceInput,
  mapOrgSettingsRow,
  mapUserPreferenceRow,
} from "@/lib/domain/settings";

export const getOrgSettings = cache(async (): Promise<OrgSettings> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("org_settings")
    .select("*")
    .eq("id", true)
    .single();
  if (error) throw error;
  return mapOrgSettingsRow(data);
});

export const getUserPreference = cache(async (userId: string): Promise<UserPreference | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_preference")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapUserPreferenceRow(data) : null;
});

export async function updateOrgSettings(patch: OrgSettingsInput, updatedBy: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("org_settings")
    .update({
      org_name: patch.orgName,
      primary_site: patch.primarySite,
      date_format: patch.dateFormat,
      code_prefix: patch.codePrefix,
      code_autogenerate: patch.codeAutogenerate,
      default_inventory_cycle_months: patch.defaultInventoryCycleMonths,
      condition_good_pct: patch.conditionGoodPct,
      condition_fair_pct: patch.conditionFairPct,
      warranty_expiring_days: patch.warrantyExpiringDays,
      notify_warranty: patch.notifyWarranty,
      notify_inventory_overdue: patch.notifyInventoryOverdue,
      notify_weekly_summary: patch.notifyWeeklySummary,
      notify_new_device: patch.notifyNewDevice,
      export_format: patch.exportFormat,
      deleted_retention_days: patch.deletedRetentionDays,
      updated_by: updatedBy,
      updated_at: new Date().toISOString(),
    })
    .eq("id", true);
  if (error) throw error;
}

export async function upsertUserPreference(userId: string, patch: UserPreferenceInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("user_preference")
    .upsert({
      user_id: userId,
      theme: patch.theme,
      default_device_view: patch.defaultDeviceView,
      mono_codes: patch.monoCodes,
      updated_at: new Date().toISOString(),
    });
  if (error) throw error;
}

export async function purgeRetiredDevices(): Promise<number> {
  const supabase = await createClient();
  const settings = await getOrgSettings();
  const cutoff = new Date(Date.now() - settings.deletedRetentionDays * 86400_000).toISOString();
  const { data, error } = await supabase
    .from("device")
    .delete()
    .eq("status", "retired")
    .lt("updated_at", cutoff)
    .select("id");
  if (error) throw error;
  return data?.length ?? 0;
}
