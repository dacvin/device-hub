"use client";

import { useState, useTransition } from "react";
import { IdCard, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useUpdateOwnProfile } from "@/features/members/hooks/use-mutate-member";
import { deriveInitials, type MemberRow } from "@/features/members/types";
import { RoleBadge } from "@/components/app/role-badge";

interface ProfileClientProps {
  member: MemberRow;
}

export function ProfileClient({ member }: ProfileClientProps) {
  const [name, setName] = useState(member.name);
  const [phone, setPhone] = useState(member.phone ?? "");
  const updateMutation = useUpdateOwnProfile();
  const [savingProfile, startProfile] = useTransition();

  const [pwOld, setPwOld] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");

  function onSaveProfile() {
    startProfile(async () => {
      try {
        await updateMutation.mutateAsync({ id: member.id, name, phone });
        toast.success("Profile saved");
      } catch (err) {
        toast.error("Save failed", {
          description: err instanceof Error ? err.message : String(err),
        });
      }
    });
  }

  function onDiscard() {
    setName(member.name);
    setPhone(member.phone ?? "");
  }

  function onPasswordSubmit() {
    if (!pwOld || !pwNew || !pwConfirm) {
      toast.error("Fill in all fields");
      return;
    }
    if (pwNew.length < 8) {
      toast.error("Password too short", {
        description: "Use at least 8 characters.",
      });
      return;
    }
    if (pwNew !== pwConfirm) {
      toast.error("Passwords don't match");
      return;
    }
    toast.success("Password updated");
    setPwOld("");
    setPwNew("");
    setPwConfirm("");
  }

  return (
    <div className="mx-auto w-full max-w-[820px] flex flex-col gap-5">
      <Card className="shadow-none gap-0 py-0">
        <div className="flex items-center gap-2 px-5 pt-5 pb-3">
          <IdCard className="size-3.5 text-muted-foreground" aria-hidden />
          <h2 className="text-[11px] uppercase tracking-[0.08em] font-semibold text-muted-foreground">
            Personal information
          </h2>
        </div>

        <div className="flex items-center gap-4 px-5 pb-5">
          <span className="size-16 rounded-full bg-primary text-primary-foreground grid place-items-center text-[18px] font-semibold shrink-0">
            {deriveInitials(name || member.name)}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-semibold tracking-[-0.01em]">
              {name || member.name}
            </div>
            <div className="text-[12px] text-muted-foreground mt-0.5">
              PNG or JPG, up to 2 MB.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              Upload photo
            </Button>
            <Button variant="ghost" size="sm" disabled>
              Remove
            </Button>
          </div>
        </div>

        <div className="px-5 pb-5 grid gap-5 md:grid-cols-2">
          <div>
            <label className="text-[12.5px] font-medium block mb-1.5">Full name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-[12.5px] font-medium block mb-1.5">Work email</label>
            <div className="relative">
              <Input value={member.email} disabled className="font-mono pr-9" />
              <Mail
                className="size-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2"
                aria-hidden
              />
            </div>
            <p className="text-[11.5px] text-muted-foreground mt-1">
              Managed by IT — contact an admin to change.
            </p>
          </div>
          <div>
            <label className="text-[12.5px] font-medium block mb-1.5">Role</label>
            <div className="h-9 px-3 rounded-md bg-muted flex items-center gap-2 text-[13px]">
              <RoleBadge role={member.role} />
              <span className="text-muted-foreground text-[12px]">
                — admin-controlled
              </span>
            </div>
          </div>
          <div>
            <label className="text-[12.5px] font-medium block mb-1.5">Phone</label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="font-mono"
              placeholder="+84 ..."
            />
          </div>
        </div>

        <div className="px-5 pb-5 flex items-center justify-end gap-2 border-t border-border pt-4">
          <Button variant="ghost" onClick={onDiscard} disabled={savingProfile}>
            Discard
          </Button>
          <Button onClick={onSaveProfile} disabled={savingProfile}>
            {savingProfile ? "Saving…" : "Save"}
          </Button>
        </div>
      </Card>

      <Card className="shadow-none gap-0 py-0">
        <div className="flex items-center gap-2 px-5 pt-5 pb-3">
          <Lock className="size-3.5 text-muted-foreground" aria-hidden />
          <h2 className="text-[11px] uppercase tracking-[0.08em] font-semibold text-muted-foreground">
            Change password
          </h2>
        </div>
        <div className="px-5 pb-5 grid gap-5 md:grid-cols-3">
          <div>
            <label className="text-[12.5px] font-medium block mb-1.5">
              Current password
            </label>
            <Input
              type="password"
              value={pwOld}
              onChange={(e) => setPwOld(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="text-[12.5px] font-medium block mb-1.5">New password</label>
            <Input
              type="password"
              value={pwNew}
              onChange={(e) => setPwNew(e.target.value)}
              autoComplete="new-password"
            />
            <p className="text-[11.5px] text-muted-foreground mt-1">
              At least 8 characters.
            </p>
          </div>
          <div>
            <label className="text-[12.5px] font-medium block mb-1.5">
              Confirm new password
            </label>
            <Input
              type="password"
              value={pwConfirm}
              onChange={(e) => setPwConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </div>
        </div>
        <div className="px-5 pb-5 flex items-center justify-end border-t border-border pt-4">
          <Button onClick={onPasswordSubmit}>Update</Button>
        </div>
      </Card>
    </div>
  );
}
