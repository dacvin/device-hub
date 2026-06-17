"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { KeyRound, Pencil, UserCheck, UserMinus, UserX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useConfirm } from "@/hooks/use-confirm";
import {
  useRemoveMember,
  useSetMemberStatus,
  useUpdateMemberRole,
} from "@/features/members/hooks/use-mutate-member";
import type { MemberRole, MemberRow } from "@/features/members/types";

export function MemberActions({ member }: { member: MemberRow }) {
  const router = useRouter();
  const confirm = useConfirm();
  const roleMutation = useUpdateMemberRole();
  const statusMutation = useSetMemberStatus();
  const removeMutation = useRemoveMember();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<MemberRole>(member.role);
  const [submitting, setSubmitting] = useState(false);

  if (member.isSelf) {
    return (
      <Button asChild size="sm" className="h-9">
        <Link href="/profile">
          <Pencil className="size-3.5" aria-hidden />
          Edit my profile
        </Link>
      </Button>
    );
  }

  async function onSubmit() {
    if (role === member.role) {
      setOpen(false);
      return;
    }
    setSubmitting(true);
    try {
      await roleMutation.mutateAsync({ id: member.id, role });
      toast.success("Member updated", { description: `Role set to ${role}.` });
      setOpen(false);
    } catch (err) {
      toast.error("Save failed", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function onReset() {
    const ok = await confirm({
      title: `Reset password for ${member.name}?`,
      confirmLabel: "Send link",
      tone: "warn",
    });
    if (!ok) return;
    toast.success("Reset link sent");
  }

  async function onToggleStatus() {
    const next = member.status === "active" ? "deactivated" : "active";
    const verb = next === "active" ? "Activate" : "Deactivate";
    const ok = await confirm({
      title: `${verb} ${member.name}?`,
      confirmLabel: verb,
      tone: next === "active" ? "warn" : "destructive",
    });
    if (!ok) return;
    try {
      await statusMutation.mutateAsync({ id: member.id, status: next });
      toast.success(`${verb}d ${member.name}`);
    } catch (err) {
      toast.error("Failed", {
        description: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async function onRemove() {
    const ok = await confirm({
      title: `Remove ${member.name}?`,
      confirmLabel: "Remove",
      tone: "destructive",
    });
    if (!ok) return;
    try {
      await removeMutation.mutateAsync(member.id);
      toast.success("Member removed");
      setTimeout(() => router.push("/members"), 600);
    } catch (err) {
      toast.error("Remove failed", {
        description: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="h-9" onClick={() => setOpen(true)}>
          <Pencil className="size-3.5" aria-hidden />
          Edit
        </Button>
        <Button variant="outline" size="sm" className="h-9" onClick={onReset}>
          <KeyRound className="size-3.5" aria-hidden />
          Reset password
        </Button>
        <Button variant="outline" size="sm" className="h-9" onClick={onToggleStatus}>
          {member.status === "active" ? (
            <UserX className="size-3.5" aria-hidden />
          ) : (
            <UserCheck className="size-3.5" aria-hidden />
          )}
          {member.status === "active" ? "Deactivate" : "Activate"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 text-destructive hover:text-destructive"
          onClick={onRemove}
        >
          <UserMinus className="size-3.5" aria-hidden />
          Remove
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit {member.name}</DialogTitle>
            <DialogDescription>
              Update this member&apos;s role. Email is managed by IT and can&apos;t be changed.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-[12.5px] font-medium block mb-1.5">Work email</label>
              <Input value={member.email} disabled className="font-mono" />
            </div>
            <div>
              <label className="text-[12.5px] font-medium block mb-1.5">Role</label>
              <Select value={role} onValueChange={(v) => setRole(v as MemberRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onSubmit} disabled={submitting}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
