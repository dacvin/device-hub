"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { groupFormSchema } from "@/lib/domain/devices";
import { createGroup, deleteGroup, updateGroup } from "@/lib/data/groups";

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
    if (id) {
      await updateGroup(id, parsed.values);
    } else {
      await createGroup(parsed.values);
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
    await deleteGroup(id);
    revalidatePath("/groups");
    return { ok: true };
  } catch (e) {
    const tCommon = await getTranslations("common");
    return { ok: false, error: e instanceof Error ? e.message : tCommon("deleteFailed") };
  }
}
