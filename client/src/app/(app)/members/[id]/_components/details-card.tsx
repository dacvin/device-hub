import { IdCard } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import type { Member, MemberRole, MemberStatus } from "@/lib/domain/members";
import { ROLE_LABEL, ROLE_TONE } from "@/lib/domain/members";
import { ShieldCheck, UserCog, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

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

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "Active now";
  if (mins < 60) return `${mins} minutes ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return "1 week ago";
  return `${weeks} weeks ago`;
}

interface DetailsCardProps {
  member: Member;
}

export async function DetailsCard({ member }: DetailsCardProps) {
  const t = await getTranslations("memberProfile");
  const RoleIcon = ROLE_ICON[member.role];
  const tone = ROLE_TONE[member.role];

  return (
    <Card className="p-[22px]">
      <div className="text-[13px] font-semibold tracking-[0.04em] uppercase text-muted-foreground flex items-center gap-2">
        <IdCard className="size-[15px] text-primary" />
        {t("detailsTitle")}
      </div>
      <div className="grid grid-cols-2 gap-x-7 gap-y-[18px] mt-[18px]">
        {/* Role */}
        <div>
          <div className="text-[12px] text-muted-foreground">{t("role")}</div>
          <div className="text-[14px] font-medium mt-[3px]">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 h-[22px] text-xs font-medium leading-none border",
                ROLE_BADGE_CLASSES[tone]
              )}
            >
              <RoleIcon className="size-3.5" />
              {ROLE_LABEL[member.role]}
            </span>
          </div>
        </div>
        {/* Department */}
        <div>
          <div className="text-[12px] text-muted-foreground">{t("department")}</div>
          <div className="text-[14px] font-medium mt-[3px]">{member.departmentName ?? "—"}</div>
        </div>
        {/* Site */}
        <div>
          <div className="text-[12px] text-muted-foreground">{t("site")}</div>
          <div className="text-[14px] font-medium mt-[3px]">{member.site ?? "—"}</div>
        </div>
        {/* Status */}
        <div>
          <div className="text-[12px] text-muted-foreground">{t("status")}</div>
          <div className="text-[14px] font-medium mt-[3px]">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 h-[22px] text-xs font-medium leading-none",
                STATUS_CLASSES[member.status]
              )}
            >
              <span className="size-1.5 rounded-full bg-current" aria-hidden />
              {member.status === "active" ? "Active" : member.status === "invited" ? "Invited" : "Disabled"}
            </span>
          </div>
        </div>
        {/* Phone */}
        <div>
          <div className="text-[12px] text-muted-foreground">{t("phone")}</div>
          <div className="text-[14px] font-mono font-normal mt-[3px]">{member.phone ?? "—"}</div>
        </div>
        {/* Reports to */}
        <div>
          <div className="text-[12px] text-muted-foreground">{t("reportsTo")}</div>
          <div className="text-[14px] font-medium mt-[3px]">{member.reportsToName ?? "—"}</div>
        </div>
        {/* Member since */}
        <div>
          <div className="text-[12px] text-muted-foreground">{t("memberSince")}</div>
          <div className="text-[14px] font-medium mt-[3px]">{formatDate(member.joinedAt)}</div>
        </div>
        {/* Last active */}
        <div>
          <div className="text-[12px] text-muted-foreground">{t("lastActive")}</div>
          <div className="text-[14px] font-normal mt-[3px]">{formatRelative(member.lastActiveAt)}</div>
        </div>
      </div>
    </Card>
  );
}
