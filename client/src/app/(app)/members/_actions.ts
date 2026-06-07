"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/data/auth";
import { logActivity } from "@/lib/data/activity";
import { can, inviteMemberSchema, type InviteMemberInput, type MemberRole } from "@/lib/domain/members";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function inviteMemberAction(input: InviteMemberInput): Promise<ActionResult> {
  const me = await getCurrentMember();
  if (!me || !can(me.role, "manageMembers")) return { ok: false, error: "not-allowed" };

  const parsed = inviteMemberSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "invalid" };

  const supabase = await createClient();
  const id = crypto.randomUUID();
  const { error } = await supabase.from("member").insert({
    id,
    name: parsed.data.name,
    email: parsed.data.email,
    role: parsed.data.role,
    status: "invited",
    department_id: parsed.data.departmentId,
    invited_by: me.id,
  });
  if (error) return { ok: false, error: error.message };

  await logActivity({
    actorId: me.id,
    action: "member.invited",
    entityType: "member",
    entityId: id,
    entityLabel: parsed.data.email,
  });

  revalidatePath("/members");
  return { ok: true };
}

export async function updateMemberRoleAction(memberId: string, role: MemberRole): Promise<ActionResult> {
  const me = await getCurrentMember();
  if (!me || !can(me.role, "manageMembers")) return { ok: false, error: "not-allowed" };

  const supabase = await createClient();
  const { error } = await supabase.from("member").update({ role }).eq("id", memberId);
  if (error) return { ok: false, error: error.message };

  await logActivity({
    actorId: me.id,
    action: "member.role_changed",
    entityType: "member",
    entityId: memberId,
    metadata: { to: role },
  });

  revalidatePath("/members");
  return { ok: true };
}

export async function removeMemberAction(memberId: string): Promise<ActionResult> {
  const me = await getCurrentMember();
  if (!me || !can(me.role, "manageMembers")) return { ok: false, error: "not-allowed" };

  const supabase = await createClient();
  const { data: row } = await supabase.from("member").select("email").eq("id", memberId).maybeSingle();
  const { error } = await supabase.from("member").delete().eq("id", memberId);
  if (error) return { ok: false, error: error.message };

  await logActivity({
    actorId: me.id,
    action: "member.removed",
    entityType: "member",
    entityId: memberId,
    entityLabel: row?.email ?? null,
  });

  revalidatePath("/members");
  return { ok: true };
}
