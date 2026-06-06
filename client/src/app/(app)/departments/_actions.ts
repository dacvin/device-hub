"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { departmentFormSchema } from "@/lib/domain/devices";
import {
  createDepartment,
  deleteDepartment,
  updateDepartment,
} from "@/lib/data/departments";

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
    if (id) {
      await updateDepartment(id, parsed.values);
    } else {
      await createDepartment(parsed.values);
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
    await deleteDepartment(id);
    revalidatePath("/departments");
    return { ok: true };
  } catch (e) {
    const tCommon = await getTranslations("common");
    return { ok: false, error: e instanceof Error ? e.message : tCommon("deleteFailed") };
  }
}
