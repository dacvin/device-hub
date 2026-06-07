import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentMember } from "@/lib/data/auth";
import { getOrgSettings, getUserPreference } from "@/lib/data/settings";
import { can } from "@/lib/domain/members";
import { PermissionDenied } from "@/components/app/states/permission-denied";
import { SettingsForm } from "./_components/settings-form";

export default async function SettingsPage() {
  const me = await getCurrentMember();
  if (!me) redirect("/login");

  const t = await getTranslations("settings");

  if (!can(me.role, "changeSettings")) {
    return (
      <PermissionDenied
        title={t("permissionDeniedTitle")}
        description={t("permissionDeniedDescription")}
      />
    );
  }

  const [settings, prefs] = await Promise.all([
    getOrgSettings(),
    getUserPreference(me.id),
  ]);

  return (
    <SettingsForm
      initialSettings={settings}
      initialPrefs={prefs}
      memberId={me.id}
    />
  );
}
