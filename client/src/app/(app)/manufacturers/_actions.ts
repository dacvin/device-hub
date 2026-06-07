"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { manufacturerFormSchema } from "@/lib/domain/devices";
import {
  createManufacturer,
  deleteManufacturer,
  getManufacturerById,
  updateManufacturer,
} from "@/lib/data/manufacturers";
import { getCurrentMember } from "@/lib/data/auth";
import { logActivity } from "@/lib/data/activity";

interface ActionResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

function parse(values: unknown) {
  const parsed = manufacturerFormSchema.safeParse(values);
  if (parsed.success) return { ok: true as const, values: parsed.data };
  const fieldErrors: Record<string, string> = {};
  for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".")] = issue.message;
  return { ok: false as const, fieldErrors };
}

export async function saveManufacturerAction(
  id: string | null,
  values: unknown
): Promise<ActionResult> {
  const parsed = parse(values);
  if (!parsed.ok) return { ok: false, fieldErrors: parsed.fieldErrors };
  try {
    const me = await getCurrentMember();
    if (id) {
      const row = await updateManufacturer(id, parsed.values);
      await logActivity({
        actorId: me?.id ?? null,
        action: "catalog.updated",
        entityType: "manufacturer",
        entityId: row.id,
        entityLabel: row.name,
      });
    } else {
      const row = await createManufacturer(parsed.values);
      await logActivity({
        actorId: me?.id ?? null,
        action: "catalog.created",
        entityType: "manufacturer",
        entityId: row.id,
        entityLabel: row.name,
      });
    }
    revalidatePath("/manufacturers");
    return { ok: true };
  } catch (e) {
    const tCommon = await getTranslations("common");
    return { ok: false, error: e instanceof Error ? e.message : tCommon("saveFailed") };
  }
}

export async function deleteManufacturerAction(id: string): Promise<ActionResult> {
  try {
    const [row, me] = await Promise.all([getManufacturerById(id), getCurrentMember()]);
    await deleteManufacturer(id);
    await logActivity({
      actorId: me?.id ?? null,
      action: "catalog.deleted",
      entityType: "manufacturer",
      entityId: id,
      entityLabel: row?.name ?? null,
    });
    revalidatePath("/manufacturers");
    return { ok: true };
  } catch (e) {
    const tCommon = await getTranslations("common");
    return { ok: false, error: e instanceof Error ? e.message : tCommon("deleteFailed") };
  }
}
