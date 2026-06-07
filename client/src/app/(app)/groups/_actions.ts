"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { groupFormSchema } from "@/lib/domain/devices";
import { createGroup, deleteGroup, getGroupById, updateGroup } from "@/lib/data/groups";
import { getCurrentMember } from "@/lib/data/auth";
import { logActivity } from "@/lib/data/activity";

interface ActionResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

function parse(values: unknown) {
  const parsed = groupFormSchema.safeParse(values);
  if (parsed.success) return { ok: true as const, values: parsed.data };
  const fieldErrors: Record<string, string> = {};
  for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".")] = issue.message;
  return { ok: false as const, fieldErrors };
}

export async function saveGroupAction(
  id: string | null,
  values: unknown
): Promise<ActionResult> {
  const parsed = parse(values);
  if (!parsed.ok) return { ok: false, fieldErrors: parsed.fieldErrors };
  try {
    const me = await getCurrentMember();
    if (id) {
      const row = await updateGroup(id, parsed.values);
      await logActivity({
        actorId: me?.id ?? null,
        action: "catalog.updated",
        entityType: "device_group",
        entityId: row.id,
        entityLabel: row.name,
      });
    } else {
      const row = await createGroup(parsed.values);
      await logActivity({
        actorId: me?.id ?? null,
        action: "catalog.created",
        entityType: "device_group",
        entityId: row.id,
        entityLabel: row.name,
      });
    }
    revalidatePath("/groups");
    return { ok: true };
  } catch (e) {
    const tCommon = await getTranslations("common");
    return { ok: false, error: e instanceof Error ? e.message : tCommon("saveFailed") };
  }
}

export async function deleteGroupAction(id: string): Promise<ActionResult> {
  try {
    const [row, me] = await Promise.all([getGroupById(id), getCurrentMember()]);
    await deleteGroup(id);
    await logActivity({
      actorId: me?.id ?? null,
      action: "catalog.deleted",
      entityType: "device_group",
      entityId: id,
      entityLabel: row?.name ?? null,
    });
    revalidatePath("/groups");
    return { ok: true };
  } catch (e) {
    const tCommon = await getTranslations("common");
    return { ok: false, error: e instanceof Error ? e.message : tCommon("deleteFailed") };
  }
}
