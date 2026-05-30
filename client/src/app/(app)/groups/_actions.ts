"use server";

import { revalidatePath } from "next/cache";
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
    return { ok: false, error: e instanceof Error ? e.message : "Save failed" };
  }
}

export async function deleteGroupAction(id: string): Promise<ActionResult> {
  try {
    await deleteGroup(id);
    revalidatePath("/groups");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Delete failed" };
  }
}
