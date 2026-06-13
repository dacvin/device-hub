"use client";

import { useTranslations } from "next-intl";
import { useCurrentMember } from "@/features/auth/hooks/use-current-member";
import { useOrgSettings } from "@/features/settings/hooks/use-org-settings";
import { useUserPreference } from "@/features/settings/hooks/use-user-preference";
import { can } from "@/lib/domain/members";
import { PageShell } from "@/components/app/page-shell";
import { PermissionDenied } from "@/components/app/states/permission-denied";
import { SettingsForm } from "./_components/settings-form";
import { SettingsPageSkeleton } from "./_components/page-skeleton";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const me = useCurrentMember();
  const orgSettings = useOrgSettings();
  const userPref = useUserPreference(me.data?.id ?? "");

  if (me.isPending || !me.data) return <SettingsPageSkeleton />;

  if (!can(me.data.role, "changeSettings")) {
    return (
      <PermissionDenied
        title={t("permissionDeniedTitle")}
        description={t("permissionDeniedDescription")}
      />
    );
  }

  if (orgSettings.isPending || userPref.isPending || !orgSettings.data) {
    return <SettingsPageSkeleton />;
  }

  return (
    <PageShell title={t("title")}>
      <SettingsForm
        initialSettings={orgSettings.data}
        initialPrefs={userPref.data ?? null}
      />
    </PageShell>
  );
}
