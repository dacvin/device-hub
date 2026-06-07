"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMember } from "@/lib/data/auth";
import { logActivity } from "@/lib/data/activity";
import { can } from "@/lib/domain/members";
import {
  orgSettingsSchema,
  userPreferenceSchema,
  type OrgSettingsInput,
  type UserPreferenceInput,
} from "@/lib/domain/settings";
import {
  updateOrgSettings,
  upsertUserPreference,
  purgeRetiredDevices,
} from "@/lib/data/settings";

type Result<T = void> = { ok: true; value?: T } | { ok: false; error: string };

export async function saveOrgSettingsAction(input: OrgSettingsInput): Promise<Result> {
  const me = await getCurrentMember();
  if (!me || !can(me.role, "changeSettings")) return { ok: false, error: "not-allowed" };
  const parsed = orgSettingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "invalid" };
  await updateOrgSettings(parsed.data, me.id);
  await logActivity({
    actorId: me.id,
    action: "settings.updated",
    entityType: "settings",
    entityId: null,
  });
  revalidatePath("/settings");
  revalidatePath("/overview");
  revalidatePath("/devices");
  return { ok: true };
}

export async function saveUserPreferenceAction(input: UserPreferenceInput): Promise<Result> {
  const me = await getCurrentMember();
  if (!me) return { ok: false, error: "not-allowed" };
  const parsed = userPreferenceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "invalid" };
  await upsertUserPreference(me.id, parsed.data);
  return { ok: true };
}

export async function purgeRetiredAction(): Promise<Result<{ count: number }>> {
  const me = await getCurrentMember();
  if (!me || !can(me.role, "changeSettings")) return { ok: false, error: "not-allowed" };
  const count = await purgeRetiredDevices();
  await logActivity({
    actorId: me.id,
    action: "settings.updated",
    entityType: "settings",
    entityId: null,
    metadata: { purged: count },
  });
  revalidatePath("/devices");
  return { ok: true, value: { count } };
}
