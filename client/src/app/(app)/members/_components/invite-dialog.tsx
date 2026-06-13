"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Department } from "@/lib/domain/devices";
import { useInviteMember } from "@/features/members/hooks/use-invite-member";

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departments: Department[];
  labels: {
    title: string;
    description: string;
    name: string;
    email: string;
    emailHelper: string;
    role: string;
    department: string;
    departmentNone: string;
    cancel: string;
    submit: string;
  };
  toastLabels: {
    invitationSent: string;
    actionFailed: string;
  };
  roleLabels: {
    it_admin: string;
    manager: string;
    viewer: string;
  };
}

export function InviteDialog({
  open,
  onOpenChange,
  departments,
  labels,
  toastLabels,
  roleLabels,
}: InviteDialogProps) {
  const router = useRouter();
  const inviteMember = useInviteMember();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("viewer");
  const [departmentId, setDepartmentId] = useState<string>("none");
  const [loading, setLoading] = useState(false);

  function reset() {
    setName("");
    setEmail("");
    setRole("viewer");
    setDepartmentId("none");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await inviteMember.mutateAsync({
        name,
        email,
        role: role as "it_admin" | "manager" | "viewer",
        departmentId: departmentId === "none" ? null : departmentId,
      });
      toast.success(toastLabels.invitationSent);
      onOpenChange(false);
      reset();
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : toastLabels.actionFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!loading) { onOpenChange(v); if (!v) reset(); } }}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{labels.title}</DialogTitle>
          <DialogDescription>{labels.description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="invite-name">{labels.name}</Label>
            <Input
              id="invite-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invite-email">{labels.email}</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="off"
            />
            <p className="text-[12px] text-muted-foreground">{labels.emailHelper}</p>
          </div>
          <div className="flex gap-3.5 items-start">
            <div className="space-y-1.5 flex-1">
              <Label htmlFor="invite-role">{labels.role}</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">{roleLabels.viewer}</SelectItem>
                  <SelectItem value="manager">{roleLabels.manager}</SelectItem>
                  <SelectItem value="it_admin">{roleLabels.it_admin}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 flex-1">
              <Label htmlFor="invite-dept">{labels.department}</Label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger id="invite-dept">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{labels.departmentNone}</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => { onOpenChange(false); reset(); }}
              disabled={loading}
            >
              {labels.cancel}
            </Button>
            <Button type="submit" disabled={loading}>
              <Send className="size-4 mr-1.5" aria-hidden />
              {labels.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
