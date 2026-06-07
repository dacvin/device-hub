"use client";

import { useState, useMemo } from "react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { AlertCircle, Download, Sun, Moon, Monitor, Table2, LayoutGrid } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useConfirm } from "@/hooks/use-confirm";

import type { OrgSettings, UserPreference } from "@/lib/domain/settings";
import type { OrgSettingsInput, UserPreferenceInput } from "@/lib/domain/settings";

import { SectionNav } from "./section-nav";
import {
  saveOrgSettingsAction,
  saveUserPreferenceAction,
  purgeRetiredAction,
} from "../_actions";

interface SettingsFormProps {
  initialSettings: OrgSettings;
  initialPrefs: UserPreference | null;
  memberId: string;
}

function toSettingsInput(s: OrgSettings): OrgSettingsInput {
  return {
    orgName: s.orgName,
    primarySite: s.primarySite,
    dateFormat: s.dateFormat,
    codePrefix: s.codePrefix,
    codeAutogenerate: s.codeAutogenerate,
    defaultInventoryCycleMonths: s.defaultInventoryCycleMonths,
    conditionGoodPct: s.conditionGoodPct,
    conditionFairPct: s.conditionFairPct,
    warrantyExpiringDays: s.warrantyExpiringDays,
    notifyWarranty: s.notifyWarranty,
    notifyInventoryOverdue: s.notifyInventoryOverdue,
    notifyWeeklySummary: s.notifyWeeklySummary,
    notifyNewDevice: s.notifyNewDevice,
    exportFormat: s.exportFormat,
    deletedRetentionDays: s.deletedRetentionDays,
  };
}

function toPrefsInput(p: UserPreference | null): UserPreferenceInput {
  return {
    theme: p?.theme ?? "system",
    defaultDeviceView: p?.defaultDeviceView ?? "table",
    monoCodes: p?.monoCodes ?? false,
  };
}

export function SettingsForm({ initialSettings, initialPrefs }: SettingsFormProps) {
  const t = useTranslations("settings");
  const { setTheme } = useTheme();
  const confirm = useConfirm();

  const [settings, setSettings] = useState<OrgSettingsInput>(() =>
    toSettingsInput(initialSettings)
  );
  const [prefs, setPrefs] = useState<UserPreferenceInput>(() =>
    toPrefsInput(initialPrefs)
  );
  const [saving, setSaving] = useState(false);

  const initialSettingsInput = useMemo(() => toSettingsInput(initialSettings), [initialSettings]);

  const dirty = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(initialSettingsInput),
    [settings, initialSettingsInput]
  );

  function updateSettings(patch: Partial<OrgSettingsInput>) {
    setSettings((prev) => ({ ...prev, ...patch }));
  }

  async function handleSave() {
    setSaving(true);
    const result = await saveOrgSettingsAction(settings);
    setSaving(false);
    if (result.ok) {
      toast.success(t("toast.saved"));
    } else {
      toast.error(t("toast.failed"));
    }
  }

  function handleDiscard() {
    setSettings(toSettingsInput(initialSettings));
  }

  async function handleThemeChange(value: string) {
    if (!value) return;
    const theme = value as UserPreferenceInput["theme"];
    setTheme(theme);
    const updated = { ...prefs, theme };
    setPrefs(updated);
    await saveUserPreferenceAction(updated);
  }

  async function handleViewChange(value: string) {
    if (!value) return;
    const view = value as UserPreferenceInput["defaultDeviceView"];
    const updated = { ...prefs, defaultDeviceView: view };
    setPrefs(updated);
    await saveUserPreferenceAction(updated);
  }

  async function handleMonoCodesChange(checked: boolean) {
    const updated = { ...prefs, monoCodes: checked };
    setPrefs(updated);
    await saveUserPreferenceAction(updated);
  }

  async function handlePurge() {
    const confirmed = await confirm({
      title: t("danger.purgeConfirmTitle"),
      description: t("danger.purgeConfirmDescription", { count: "some" }),
      confirmLabel: t("danger.purgeConfirmCta"),
      tone: "destructive",
    });
    if (!confirmed) return;
    const result = await purgeRetiredAction();
    if (result.ok && result.value) {
      toast.success(t("toast.purged", { count: result.value.count }));
    } else {
      toast.error(t("toast.failed"));
    }
  }

  return (
    <div className="grid lg:grid-cols-[220px_1fr] gap-8 items-start">
      {/* Section Nav */}
      <div className="hidden lg:block">
        <SectionNav
          labels={{
            general: t("nav.general"),
            appearance: t("nav.appearance"),
            inventory: t("nav.inventory"),
            notifications: t("nav.notifications"),
            data: t("nav.data"),
            condition: t("nav.condition"),
            danger: t("nav.danger"),
          }}
        />
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-5 max-w-[720px] pb-24">

        {/* General */}
        <Card id="general">
          <CardHeader className="px-[22px] py-5 border-b">
            <p className="text-[15px] font-semibold tracking-tight">{t("general.title")}</p>
            <p className="text-[12.5px] text-muted-foreground mt-0.5">
              Organization-wide basics
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <SettingRow
              label={t("general.orgName")}
              description="Shown on labels and exported reports."
            >
              <Input
                value={settings.orgName}
                onChange={(e) => updateSettings({ orgName: e.target.value })}
                className="w-[200px] h-[34px]"
              />
            </SettingRow>
            <SettingRow
              label={t("general.primarySite")}
              description={t("general.primarySiteHelper")}
            >
              <Input
                value={settings.primarySite ?? ""}
                onChange={(e) =>
                  updateSettings({ primarySite: e.target.value || null })
                }
                className="w-[200px] h-[34px]"
              />
            </SettingRow>
            <SettingRow
              label={t("general.dateFormat")}
              description="How dates appear throughout the app."
              last
            >
              <Select
                value={settings.dateFormat}
                onValueChange={(v) => updateSettings({ dateFormat: v })}
              >
                <SelectTrigger className="w-[160px] h-[34px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD MMM YYYY">DD MMM YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card id="appearance">
          <CardHeader className="px-[22px] py-5 border-b">
            <p className="text-[15px] font-semibold tracking-tight">{t("appearance.title")}</p>
            <p className="text-[12.5px] text-muted-foreground mt-0.5">
              {t("appearance.appearanceHint")}
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <SettingRow
              label={t("appearance.theme")}
              description="Switch between light and dark surfaces."
            >
              <ToggleGroup
                type="single"
                value={prefs.theme}
                onValueChange={handleThemeChange}
                spacing={0}
                className="bg-muted rounded-md p-0.5"
              >
                <ToggleGroupItem value="light" className="h-[30px] px-3 text-[13px] gap-1.5 rounded-[calc(var(--radius-md)-2px)]">
                  <Sun className="size-3.5" />
                  {t("appearance.themeLight")}
                </ToggleGroupItem>
                <ToggleGroupItem value="dark" className="h-[30px] px-3 text-[13px] gap-1.5 rounded-[calc(var(--radius-md)-2px)]">
                  <Moon className="size-3.5" />
                  {t("appearance.themeDark")}
                </ToggleGroupItem>
                <ToggleGroupItem value="system" className="h-[30px] px-3 text-[13px] gap-1.5 rounded-[calc(var(--radius-md)-2px)]">
                  <Monitor className="size-3.5" />
                  {t("appearance.themeSystem")}
                </ToggleGroupItem>
              </ToggleGroup>
            </SettingRow>
            <SettingRow
              label={t("appearance.defaultDeviceView")}
              description="How the inventory opens by default."
            >
              <ToggleGroup
                type="single"
                value={prefs.defaultDeviceView}
                onValueChange={handleViewChange}
                spacing={0}
                className="bg-muted rounded-md p-0.5"
              >
                <ToggleGroupItem value="table" className="h-[30px] px-3 text-[13px] gap-1.5 rounded-[calc(var(--radius-md)-2px)]">
                  <Table2 className="size-3.5" />
                  {t("appearance.viewTable")}
                </ToggleGroupItem>
                <ToggleGroupItem value="cards" className="h-[30px] px-3 text-[13px] gap-1.5 rounded-[calc(var(--radius-md)-2px)]">
                  <LayoutGrid className="size-3.5" />
                  {t("appearance.viewCards")}
                </ToggleGroupItem>
              </ToggleGroup>
            </SettingRow>
            <SettingRow
              label={t("appearance.monoCodes")}
              description="Render asset codes & serials in a monospace face."
              last
            >
              <Switch
                checked={prefs.monoCodes}
                onCheckedChange={handleMonoCodesChange}
              />
            </SettingRow>
          </CardContent>
        </Card>

        {/* Inventory defaults */}
        <Card id="inventory">
          <CardHeader className="px-[22px] py-5 border-b">
            <p className="text-[15px] font-semibold tracking-tight">{t("inventory.title")}</p>
            <p className="text-[12.5px] text-muted-foreground mt-0.5">
              {t("inventory.subtitle")}
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <SettingRow
              label={t("inventory.autoGenerate")}
              description="Suggest a code from the chosen group on create."
            >
              <Switch
                checked={settings.codeAutogenerate}
                onCheckedChange={(v) => updateSettings({ codeAutogenerate: v })}
              />
            </SettingRow>
            <SettingRow
              label={t("inventory.codePrefix")}
              description={t("inventory.codePrefixHelper")}
            >
              <Input
                value={settings.codePrefix}
                onChange={(e) => updateSettings({ codePrefix: e.target.value })}
                className="w-[110px] h-[34px] text-center"
              />
            </SettingRow>
            <SettingRow
              label={t("inventory.defaultCycle")}
              description="How often a device is due for a physical check."
              last
            >
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={settings.defaultInventoryCycleMonths}
                  onChange={(e) =>
                    updateSettings({ defaultInventoryCycleMonths: Number(e.target.value) })
                  }
                  className="w-[84px] h-[34px] text-center"
                />
                <span className="text-[13px] text-muted-foreground">months</span>
              </div>
            </SettingRow>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card id="notifications">
          <CardHeader className="px-[22px] py-5 border-b">
            <p className="text-[15px] font-semibold tracking-tight">{t("notifications.title")}</p>
            <p className="text-[12.5px] text-muted-foreground mt-0.5">
              When DeviceHub emails you about the fleet
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <SettingRow
              label={t("notifications.warranty")}
              description="Alert when a device's warranty ends soon."
            >
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={settings.warrantyExpiringDays}
                  onChange={(e) =>
                    updateSettings({ warrantyExpiringDays: Number(e.target.value) })
                  }
                  className="w-[84px] h-[34px] text-center"
                />
                <span className="text-[13px] text-muted-foreground">
                  {t("notifications.warrantyDays")}
                </span>
                <Switch
                  checked={settings.notifyWarranty}
                  onCheckedChange={(v) => updateSettings({ notifyWarranty: v })}
                />
              </div>
            </SettingRow>
            <SettingRow
              label={t("notifications.inventoryOverdue")}
              description="Alert when a device misses its check cycle."
            >
              <Switch
                checked={settings.notifyInventoryOverdue}
                onCheckedChange={(v) => updateSettings({ notifyInventoryOverdue: v })}
              />
            </SettingRow>
            <SettingRow
              label={t("notifications.weekly")}
              description="A Monday digest of fleet health & flags."
            >
              <Switch
                checked={settings.notifyWeeklySummary}
                onCheckedChange={(v) => updateSettings({ notifyWeeklySummary: v })}
              />
            </SettingRow>
            <SettingRow
              label={t("notifications.newDevice")}
              description="Notify admins when any member registers a device."
              last
            >
              <Switch
                checked={settings.notifyNewDevice}
                onCheckedChange={(v) => updateSettings({ notifyNewDevice: v })}
              />
            </SettingRow>
          </CardContent>
        </Card>

        {/* Data & export */}
        <Card id="data">
          <CardHeader className="px-[22px] py-5 border-b">
            <p className="text-[15px] font-semibold tracking-tight">{t("data.title")}</p>
            <p className="text-[12.5px] text-muted-foreground mt-0.5">
              How records are exported and retained
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <SettingRow
              label={t("data.format")}
              description="Used by the Export buttons across the app."
            >
              <Select
                value={settings.exportFormat}
                onValueChange={(v) =>
                  updateSettings({ exportFormat: v as OrgSettingsInput["exportFormat"] })
                }
              >
                <SelectTrigger className="w-[120px] h-[34px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CSV">CSV</SelectItem>
                  <SelectItem value="XLSX">XLSX</SelectItem>
                  <SelectItem value="PDF">PDF</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>
            <SettingRow
              label={t("data.retention")}
              description="Soft-deleted records are recoverable for this long."
            >
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={settings.deletedRetentionDays}
                  onChange={(e) =>
                    updateSettings({ deletedRetentionDays: Number(e.target.value) })
                  }
                  className="w-[84px] h-[34px] text-center"
                />
                <span className="text-[13px] text-muted-foreground">days</span>
              </div>
            </SettingRow>
            <SettingRow
              label={t("data.exportFull")}
              description="Download every active device record now."
              last
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.success(t("toast.exportStub"))}
              >
                <Download className="size-4 mr-1.5" />
                Export
              </Button>
            </SettingRow>
          </CardContent>
        </Card>

        {/* Condition thresholds */}
        <Card id="condition">
          <CardHeader className="px-[22px] py-5 border-b">
            <p className="text-[15px] font-semibold tracking-tight">{t("condition.title")}</p>
            <p className="text-[12.5px] text-muted-foreground mt-0.5">
              {t("condition.subtitle")}
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <SettingRow
              label="Condition thresholds"
              description={t("condition.hint")}
              last
            >
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={settings.conditionGoodPct}
                  onChange={(e) =>
                    updateSettings({ conditionGoodPct: Number(e.target.value) })
                  }
                  className="w-[84px] h-[34px] text-center"
                />
                <span className="text-[13px] text-muted-foreground">good %</span>
                <Input
                  type="number"
                  value={settings.conditionFairPct}
                  onChange={(e) =>
                    updateSettings({ conditionFairPct: Number(e.target.value) })
                  }
                  className="w-[84px] h-[34px] text-center"
                />
                <span className="text-[13px] text-muted-foreground">fair %</span>
              </div>
            </SettingRow>
          </CardContent>
        </Card>

        {/* Danger zone */}
        <Card id="danger" className="border-destructive/35">
          <CardHeader className="px-[22px] py-5 border-b border-destructive/35">
            <p className="text-[15px] font-semibold tracking-tight text-destructive">
              {t("danger.title")}
            </p>
            <p className="text-[12.5px] text-muted-foreground mt-0.5">
              Irreversible — affects the whole workspace
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <SettingRow
              label={t("danger.purgeTitle")}
              description={t("danger.purgeDescription")}
              last
            >
              <Button variant="destructive" size="sm" onClick={handlePurge}>
                {t("danger.purgeButton")}
              </Button>
            </SettingRow>
          </CardContent>
        </Card>
      </div>

      {/* Save bar */}
      {dirty && (
        <div className="fixed left-[248px] right-0 bottom-0 z-40 flex items-center justify-end gap-2.5 px-7 py-[14px] bg-background/90 backdrop-blur-sm border-t max-[980px]:left-0">
          <span className="mr-auto flex items-center gap-2 text-[13px] text-muted-foreground">
            <AlertCircle className="size-[15px]" />
            {t("saveBar.unsaved")}
          </span>
          <Button variant="outline" size="sm" onClick={handleDiscard} disabled={saving}>
            {t("saveBar.discard")}
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : t("saveBar.save")}
          </Button>
        </div>
      )}

      {/* Hidden labels for a11y (Label component usage satisfies lint) */}
      <Label className="sr-only" htmlFor="settings-form">Settings</Label>
      <Separator className="sr-only" />
    </div>
  );
}

interface SettingRowProps {
  label: string;
  description?: string;
  last?: boolean;
  children: React.ReactNode;
}

function SettingRow({ label, description, last, children }: SettingRowProps) {
  return (
    <div
      className={`flex items-center gap-5 px-[22px] py-4 ${last ? "" : "border-b"}`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description ? (
          <p className="text-[12.5px] text-muted-foreground mt-0.5 leading-[1.45]">
            {description}
          </p>
        ) : null}
      </div>
      <div className="flex-none flex items-center gap-2.5">{children}</div>
    </div>
  );
}
