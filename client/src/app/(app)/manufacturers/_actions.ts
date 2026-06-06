"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { manufacturerFormSchema } from "@/lib/domain/devices";
import {
  createManufacturer,
  deleteManufacturer,
  updateManufacturer,
} from "@/lib/data/manufacturers";

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
    if (id) {
      await updateManufacturer(id, parsed.values);
    } else {
      await createManufacturer(parsed.values);
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
    await deleteManufacturer(id);
    revalidatePath("/manufacturers");
    return { ok: true };
  } catch (e) {
    const tCommon = await getTranslations("common");
    return { ok: false, error: e instanceof Error ? e.message : tCommon("deleteFailed") };
  }
}
