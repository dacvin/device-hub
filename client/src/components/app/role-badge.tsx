import { ShieldCheck, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { MemberRole, MemberStatus } from "@/features/members/types";

export function RoleBadge({ role }: { role: MemberRole }) {
  if (role === "admin") {
    return (
      <Badge variant="default" className="font-medium">
        <ShieldCheck className="size-3" aria-hidden />
        Admin
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="font-medium">
      <User className="size-3" aria-hidden />
      Member
    </Badge>
  );
}

const STATUS_LABEL: Record<MemberStatus, string> = {
  active: "Active",
  invited: "Invited",
  deactivated: "Deactivated",
};

const STATUS_TONE: Record<MemberStatus, string> = {
  active:
    "bg-[oklch(0.93_0.05_160)] text-[oklch(0.32_0.06_170)] dark:bg-[oklch(0.30_0.05_170)] dark:text-[oklch(0.85_0.08_160)]",
  invited:
    "bg-[oklch(0.96_0.05_85)] text-[oklch(0.48_0.10_70)] dark:bg-[oklch(0.34_0.06_75)] dark:text-[oklch(0.84_0.12_85)]",
  deactivated: "bg-muted text-muted-foreground",
};

export function MemberStatusBadge({ status }: { status: MemberStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-[3px] text-[11.5px] font-medium leading-none whitespace-nowrap ${STATUS_TONE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
