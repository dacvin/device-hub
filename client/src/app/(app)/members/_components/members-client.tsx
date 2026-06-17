"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Download,
  KeyRound,
  Pencil,
  ShieldCheck,
  User,
  UserCheck,
  UserMinus,
  UserPlus,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
import { Badge } from "@/components/ui/badge";
import { useConfirm } from "@/hooks/use-confirm";
import { MemberStatusBadge, RoleBadge } from "@/components/app/role-badge";
import { useMembers } from "@/features/members/hooks/use-members";
import {
  useInviteMember,
  useRemoveMember,
  useSetMemberStatus,
  useUpdateMemberRole,
} from "@/features/members/hooks/use-mutate-member";
import {
  deriveInitials,
  relativeLastActive,
  type MemberRole,
  type MemberRow,
  type MemberStatus,
} from "@/features/members/types";
import { cn } from "@/lib/utils";
import { MembersPageSkeleton } from "./members-page-skeleton";

const ROLE_DESC: Record<MemberRole, string> = {
  admin: "Full access — manage every device, catalog & member.",
  member: "Manage and view devices in the inventory.",
};

const ROLE_ICON: Record<MemberRole, typeof ShieldCheck> = {
  admin: ShieldCheck,
  member: User,
};

type RoleFilter = "all" | MemberRole;

export function MembersClient() {
  const { data: members, isPending } = useMembers();
  const inviteMutation = useInviteMember();
  const roleMutation = useUpdateMemberRole();
  const statusMutation = useSetMemberStatus();
  const removeMutation = useRemoveMember();
  const confirm = useConfirm();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MemberRow | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [roleInput, setRoleInput] = useState<MemberRole>("member");
  const [submitting, setSubmitting] = useState(false);

  const allMembers: MemberRow[] = members ?? [];
  const adminCount = useMemo(
    () => allMembers.filter((m) => m.role === "admin").length,
    [allMembers],
  );
  const memberCount = useMemo(
    () => allMembers.filter((m) => m.role === "member").length,
    [allMembers],
  );
  const pendingCount = useMemo(
    () => allMembers.filter((m) => m.status === "invited").length,
    [allMembers],
  );

  const filtered = useMemo(() => {
    return allMembers.filter((m) => {
      if (roleFilter !== "all" && m.role !== roleFilter) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        if (!m.name.toLowerCase().includes(q) && !m.email.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [allMembers, roleFilter, query]);

  const allChecked = filtered.length > 0 && selected.size === filtered.length;
  const someChecked = selected.size > 0 && !allChecked;

  function toggleAll() {
    if (allChecked) setSelected(new Set());
    else setSelected(new Set(filtered.map((m) => m.id)));
  }
  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openInvite() {
    setEditing(null);
    setEmailInput("");
    setRoleInput("member");
    setDialogOpen(true);
  }
  function openEdit(m: MemberRow) {
    setEditing(m);
    setEmailInput(m.email);
    setRoleInput(m.role);
    setDialogOpen(true);
  }

  async function onSubmit() {
    setSubmitting(true);
    try {
      if (editing) {
        if (editing.role !== roleInput) {
          try {
            await roleMutation.mutateAsync({ id: editing.id, role: roleInput });
            toast.success("Member updated", { description: `Role set to ${roleInput}.` });
          } catch (err) {
            toast.error("Save failed", {
              description: err instanceof Error ? err.message : String(err),
            });
            return;
          }
        } else {
          toast.success("Member updated");
        }
      } else {
        try {
          await inviteMutation.mutateAsync({ email: emailInput, role: roleInput });
          toast.success("Invitation sent", { description: `${emailInput} will get an email shortly.` });
        } catch (err) {
          toast.error("Invite failed", {
            description: err instanceof Error ? err.message : String(err),
          });
          return;
        }
      }
      setDialogOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  async function onResetPassword(m: MemberRow) {
    const ok = await confirm({
      title: `Reset password for ${m.name}?`,
      description: "They'll get a one-time reset link by email.",
      confirmLabel: "Send link",
      tone: "warn",
    });
    if (!ok) return;
    toast.success("Reset link sent");
  }

  async function onToggleStatus(m: MemberRow) {
    if (m.isSelf) return;
    const next: MemberStatus = m.status === "active" ? "deactivated" : "active";
    const verb = next === "active" ? "Activate" : "Deactivate";
    const ok = await confirm({
      title: `${verb} ${m.name}?`,
      description:
        next === "active"
          ? "They'll regain access immediately."
          : "Their access will be revoked. You can reactivate later.",
      confirmLabel: verb,
      tone: next === "active" ? "warn" : "destructive",
    });
    if (!ok) return;
    try {
      await statusMutation.mutateAsync({ id: m.id, status: next });
      toast.success(`${verb}d ${m.name}`);
    } catch (err) {
      toast.error("Failed", {
        description: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async function onRemove(m: MemberRow) {
    if (m.isSelf) return;
    const ok = await confirm({
      title: `Remove ${m.name}?`,
      description: "They lose access to DeviceHub. You can re-invite later.",
      confirmLabel: "Remove",
      tone: "destructive",
    });
    if (!ok) return;
    try {
      await removeMutation.mutateAsync(m.id);
      toast.success("Member removed");
    } catch (err) {
      toast.error("Remove failed", {
        description: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async function onBulkRemove() {
    const targets = filtered.filter((m) => selected.has(m.id) && !m.isSelf);
    if (targets.length === 0) return;
    const ok = await confirm({
      title: `Remove ${targets.length} ${targets.length === 1 ? "member" : "members"}?`,
      confirmLabel: "Remove",
      tone: "destructive",
    });
    if (!ok) return;
    let failed = 0;
    for (const m of targets) {
      try {
        await removeMutation.mutateAsync(m.id);
      } catch {
        failed++;
      }
    }
    if (failed) toast.error(`${failed} remove${failed === 1 ? "" : "s"} failed`);
    else toast.success(`Removed ${targets.length} members`);
    setSelected(new Set());
  }

  if (isPending) {
    return <MembersPageSkeleton />;
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2.5 mb-5 max-[640px]:flex-col max-[640px]:items-stretch">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search members…"
          className="h-9 w-[260px] max-[640px]:w-full rounded-md border border-input bg-card px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
        />
        <div className="ml-auto flex items-center gap-2 max-[640px]:ml-0 max-[640px]:w-full">
          <Button variant="outline" size="sm" className="h-9" type="button">
            <Download className="size-3.5" aria-hidden />
            Export
          </Button>
          <Button size="sm" className="h-9" onClick={openInvite}>
            <UserPlus className="size-3.5" aria-hidden />
            Invite member
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 max-[880px]:grid-cols-1 gap-4 mb-5">
        {(["admin", "member"] as MemberRole[]).map((r) => {
          const Icon = ROLE_ICON[r];
          const count = r === "admin" ? adminCount : memberCount;
          return (
            <Card key={r} className="shadow-none p-5 flex items-center gap-4">
              <span
                className={cn(
                  "size-12 rounded-xl grid place-items-center shrink-0",
                  r === "admin"
                    ? "bg-primary/15 text-primary"
                    : "bg-secondary text-secondary-foreground",
                )}
              >
                <Icon className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <div className="text-[26px] font-semibold leading-none tabular-nums">{count}</div>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-[13.5px] font-medium capitalize">{r}s</span>
                  <span className="text-[12px] text-muted-foreground truncate">
                    {ROLE_DESC[r]}
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="flex items-center justify-between mb-3.5">
        <ToggleGroup
          type="single"
          value={roleFilter}
          onValueChange={(v) => v && setRoleFilter(v as RoleFilter)}
          className="justify-start"
        >
          <ToggleGroupItem value="all" className="text-[12.5px]">
            All
          </ToggleGroupItem>
          <ToggleGroupItem value="admin" className="text-[12.5px]">
            Admins
          </ToggleGroupItem>
          <ToggleGroupItem value="member" className="text-[12.5px]">
            Members
          </ToggleGroupItem>
        </ToggleGroup>
        <div className="text-[12.5px] text-muted-foreground">
          <span className="font-semibold text-foreground tabular-nums">{filtered.length}</span>{" "}
          members ·{" "}
          <span className="font-semibold text-foreground tabular-nums">{adminCount}</span> admins ·{" "}
          <span className="font-semibold text-foreground tabular-nums">{pendingCount}</span> pending
          invite
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="py-10 shadow-none">
          <p className="text-center text-[13px] text-muted-foreground">
            No members match.
          </p>
        </Card>
      ) : (
        <Card className="shadow-none py-0 overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-[940px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[44px] pl-5">
                    <Checkbox
                      checked={someChecked ? "indeterminate" : allChecked}
                      onCheckedChange={toggleAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Last active</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[160px] pr-5"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => {
                  const isSel = selected.has(m.id);
                  return (
                    <TableRow
                      key={m.id}
                      className={cn("group/row", isSel && "bg-secondary/40")}
                    >
                      <TableCell className="pl-5">
                        <Checkbox
                          checked={isSel}
                          onCheckedChange={() => toggleRow(m.id)}
                          aria-label={`Select ${m.name}`}
                          disabled={m.isSelf}
                        />
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/members/${encodeURIComponent(m.email)}`}
                          className="flex items-center gap-3 min-w-0 text-foreground hover:text-foreground"
                        >
                          <span className="size-9 rounded-full bg-primary text-primary-foreground grid place-items-center text-[11px] font-semibold shrink-0">
                            {deriveInitials(m.name)}
                          </span>
                          <span className="min-w-0">
                            <span className="flex items-center gap-2">
                              <span className="text-[13.5px] font-medium truncate">{m.name}</span>
                              {m.isSelf ? (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  You
                                </Badge>
                              ) : null}
                            </span>
                            <span className="block text-[12px] text-muted-foreground truncate font-mono">
                              {m.email}
                            </span>
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <RoleBadge role={m.role} />
                      </TableCell>
                      <TableCell className="text-[12.5px] text-muted-foreground">
                        {relativeLastActive(m.lastActiveAt)}
                      </TableCell>
                      <TableCell>
                        <MemberStatusBadge status={m.status} />
                      </TableCell>
                      <TableCell className="pr-5">
                        <div className="flex items-center gap-1 justify-end opacity-0 group-hover/row:opacity-100 transition-opacity">
                          {m.isSelf ? (
                            <Link
                              href="/profile"
                              className="size-8 rounded-md grid place-items-center hover:bg-muted text-muted-foreground"
                              aria-label="Edit my profile"
                            >
                              <Pencil className="size-4" aria-hidden />
                            </Link>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => openEdit(m)}
                                className="size-8 rounded-md grid place-items-center hover:bg-muted text-muted-foreground"
                                aria-label={`Edit ${m.name}`}
                              >
                                <Pencil className="size-4" aria-hidden />
                              </button>
                              <button
                                type="button"
                                onClick={() => onResetPassword(m)}
                                className="size-8 rounded-md grid place-items-center hover:bg-muted text-muted-foreground"
                                aria-label={`Reset password for ${m.name}`}
                              >
                                <KeyRound className="size-4" aria-hidden />
                              </button>
                              <button
                                type="button"
                                onClick={() => onToggleStatus(m)}
                                className="size-8 rounded-md grid place-items-center hover:bg-muted text-muted-foreground"
                                aria-label={
                                  m.status === "active"
                                    ? `Deactivate ${m.name}`
                                    : `Activate ${m.name}`
                                }
                              >
                                {m.status === "active" ? (
                                  <UserX className="size-4" aria-hidden />
                                ) : (
                                  <UserCheck className="size-4" aria-hidden />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => onRemove(m)}
                                className="size-8 rounded-md grid place-items-center hover:bg-muted text-muted-foreground hover:text-destructive"
                                aria-label={`Remove ${m.name}`}
                              >
                                <UserMinus className="size-4" aria-hidden />
                              </button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {selected.size > 0 ? (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-full bg-card text-card-foreground ring-1 ring-foreground/10 shadow-lg px-3 py-2">
          <span className="text-[12.5px] font-medium px-2 tabular-nums">
            {selected.size} selected
          </span>
          <span className="h-5 w-px bg-border" aria-hidden />
          <Button
            variant="ghost"
            size="sm"
            onClick={onBulkRemove}
            className="text-destructive hover:text-destructive"
          >
            <UserMinus className="size-3.5" aria-hidden />
            Remove
          </Button>
        </div>
      ) : null}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.name}` : "Invite member"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Update this member's role. Email is managed by IT and can't be changed."
                : "They'll get an email to join with the role you pick. Only admins can invite."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-[12.5px] font-medium block mb-1.5">
                Work email <span className="text-destructive">*</span>
              </label>
              <Input
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="vinh.huynh@gmail.com"
                disabled={!!editing}
                className="font-mono"
              />
              {!editing ? (
                <p className="text-[11.5px] text-muted-foreground mt-1">
                  Must be an IT-managed @gmail.com account.
                </p>
              ) : null}
            </div>
            <div>
              <label className="text-[12.5px] font-medium block mb-1.5">Role</label>
              <Select
                value={roleInput}
                onValueChange={(v) => setRoleInput(v as MemberRole)}
              >
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
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onSubmit} disabled={submitting}>
              {editing ? "Save" : "Send invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
