"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { departmentFormSchema } from "@/lib/domain/devices";
import {
  createDepartment,
  deleteDepartment,
  getDepartmentById,
  updateDepartment,
} from "@/lib/data/departments";
import { getCurrentMember } from "@/lib/data/auth";
import { logActivity } from "@/lib/data/activity";

interface ActionResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

function parse(values: unknown) {
  const parsed = departmentFormSchema.safeParse(values);
  if (parsed.success) return { ok: true as const, values: parsed.data };
  const fieldErrors: Record<string, string> = {};
  for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".")] = issue.message;
  return { ok: false as const, fieldErrors };
}

export async function saveDepartmentAction(
  id: string | null,
  values: unknown
): Promise<ActionResult> {
  const parsed = parse(values);
  if (!parsed.ok) return { ok: false, fieldErrors: parsed.fieldErrors };
  try {
    const me = await getCurrentMember();
    if (id) {
      const row = await updateDepartment(id, parsed.values);
      await logActivity({
        actorId: me?.id ?? null,
        action: "catalog.updated",
        entityType: "department",
        entityId: row.id,
        entityLabel: row.name,
      });
    } else {
      const row = await createDepartment(parsed.values);
      await logActivity({
        actorId: me?.id ?? null,
        action: "catalog.created",
        entityType: "department",
        entityId: row.id,
        entityLabel: row.name,
      });
    }
    revalidatePath("/departments");
    return { ok: true };
  } catch (e) {
    const tCommon = await getTranslations("common");
    return { ok: false, error: e instanceof Error ? e.message : tCommon("saveFailed") };
  }
}

export async function deleteDepartmentAction(id: string): Promise<ActionResult> {
  try {
    const [row, me] = await Promise.all([getDepartmentById(id), getCurrentMember()]);
    await deleteDepartment(id);
    await logActivity({
      actorId: me?.id ?? null,
      action: "catalog.deleted",
      entityType: "department",
      entityId: id,
      entityLabel: row?.name ?? null,
    });
    revalidatePath("/departments");
    return { ok: true };
  } catch (e) {
    const tCommon = await getTranslations("common");
    return { ok: false, error: e instanceof Error ? e.message : tCommon("deleteFailed") };
  }
}
