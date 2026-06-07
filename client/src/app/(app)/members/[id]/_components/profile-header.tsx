import Link from "next/link";
import { ArrowLeft, Mail, Pencil, ShieldCheck, UserCog, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";
import type { Member, MemberRole, MemberStatus } from "@/lib/domain/members";
import { ROLE_LABEL, ROLE_TONE } from "@/lib/domain/members";
import { cn } from "@/lib/utils";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const ROLE_ICON: Record<MemberRole, React.ElementType> = {
  it_admin: ShieldCheck,
  manager: UserCog,
  viewer: Eye,
};

const ROLE_BADGE_CLASSES: Record<"primary" | "secondary" | "muted", string> = {
  primary: "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary border-transparent",
  secondary: "bg-secondary text-secondary-foreground border-transparent",
  muted: "bg-muted text-muted-foreground border-transparent",
};

const STATUS_CLASSES: Record<MemberStatus, string> = {
  active:
    "bg-[color-mix(in_oklch,var(--green-200)_55%,var(--card))] text-[var(--green-900)] dark:bg-[color-mix(in_oklch,var(--green-800)_40%,var(--card))] dark:text-[var(--green-300)]",
  invited:
    "bg-[oklch(0.96_0.05_85)] text-[oklch(0.48_0.10_70)] dark:bg-[oklch(0.34_0.06_75)] dark:text-[oklch(0.84_0.12_85)]",
  disabled: "bg-muted text-muted-foreground",
};

interface ProfileHeaderProps {
  member: Member;
  isYou: boolean;
}

export async function ProfileHeader({ member, isYou }: ProfileHeaderProps) {
  const t = await getTranslations("memberProfile");
  const RoleIcon = ROLE_ICON[member.role];
  const tone = ROLE_TONE[member.role];

  return (
    <div>
      <Link
        href="/members"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="size-[15px]" />
        {t("back")}
      </Link>

      <div className="flex items-start gap-[18px]">
        {/* Avatar */}
        <span className="size-14 rounded-full bg-primary text-primary-foreground text-[19px] font-semibold inline-flex items-center justify-center flex-none">
          {getInitials(member.name)}
        </span>

        {/* Name + email + badges */}
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2.5 flex-wrap">
            {member.name}
            {isYou && (
              <span className="text-[11px] font-semibold text-primary bg-secondary rounded-full px-2 py-0.5 tracking-wide">
                {t("youPill")}
              </span>
            )}
          </h1>
          <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
            <span className="text-[13.5px] text-muted-foreground">{member.email}</span>
            <span className="h-3.5 w-px bg-border" />
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 h-[22px] text-xs font-medium leading-none border",
                ROLE_BADGE_CLASSES[tone]
              )}
            >
              <RoleIcon className="size-3.5" />
              {ROLE_LABEL[member.role]}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 h-[22px] text-xs font-medium leading-none",
                STATUS_CLASSES[member.status]
              )}
            >
              <span className="size-1.5 rounded-full bg-current" aria-hidden />
              {member.status === "active"
                ? "Active"
                : member.status === "invited"
                  ? "Invited"
                  : "Disabled"}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-2 flex-none">
          <Button variant="outline" size="sm" asChild>
            <a href={`mailto:${member.email}`}>
              <Mail className="size-4" />
              {t("message")}
            </a>
          </Button>
          <Button size="sm">
            <Pencil className="size-4" />
            {t("editMember")}
          </Button>
        </div>
      </div>
    </div>
  );
}
