import { createClient } from "@/lib/supabase/client";
import type { OrgSettingsInput } from "@/lib/domain/settings";

export async function updateOrgSettings(patch: OrgSettingsInput, updatedBy: string): Promise<void> {
  const supabase = createClient();
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
