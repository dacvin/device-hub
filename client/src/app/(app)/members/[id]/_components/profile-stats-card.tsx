import Link from "next/link";
import { HardDrive, ShieldCheck, UserCog, Eye, Building2, MapPin, CalendarClock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import type { Member, MemberRole } from "@/lib/domain/members";
import { ROLE_LABEL } from "@/lib/domain/members";

const ROLE_ICON: Record<MemberRole, React.ElementType> = {
  it_admin: ShieldCheck,
  manager: UserCog,
  viewer: Eye,
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

interface ProfileStatsCardProps {
  member: Member;
  managedCount: number;
}

export function ProfileStatsCard({ member, managedCount }: ProfileStatsCardProps) {
  const t = useTranslations("memberProfile");
  const RoleIcon = ROLE_ICON[member.role];
  const canManage = member.role !== "viewer";

  return (
    <div className="space-y-4">
      {/* Managed devices big number card */}
      <Card className="p-[22px]">
        <div className="text-[13px] font-semibold tracking-[0.04em] uppercase text-muted-foreground flex items-center gap-2">
          <HardDrive className="size-[15px] text-primary" />
          {t("devicesManagedTitle")}
        </div>
        <div className="text-[28px] font-semibold tracking-tight leading-none tabular-nums mt-3.5">
          {canManage ? managedCount : "—"}
        </div>
        <div className="text-[12.5px] text-muted-foreground mt-1.5">
          {canManage
            ? member.departmentName
              ? `Active devices in ${member.departmentName}`
              : t("devicesCount", { count: managedCount })
            : "Read-only access"}
        </div>
      </Card>

      {/* Stats list card */}
      <Card className="px-[22px] py-2">
        {/* Role */}
        <div className="flex items-center gap-3 py-3.5 border-b border-border">
          <span className="size-[34px] rounded-[9px] bg-muted inline-flex items-center justify-center flex-none text-muted-foreground">
            <RoleIcon className="size-[17px]" />
          </span>
          <div>
            <div className="text-[12px] text-muted-foreground">{t("role")}</div>
            <div className="text-[14px] font-medium mt-px">{ROLE_LABEL[member.role]}</div>
          </div>
        </div>

        {/* Department */}
        <div className="flex items-center gap-3 py-3.5 border-b border-border">
          <span className="size-[34px] rounded-[9px] bg-muted inline-flex items-center justify-center flex-none text-muted-foreground">
            <Building2 className="size-[17px]" />
          </span>
          <div>
            <div className="text-[12px] text-muted-foreground">{t("department")}</div>
            <div className="text-[14px] font-medium mt-px">
              {member.departmentId ? (
                <Link
                  href={`/devices?dept=${member.departmentId}`}
                  className="hover:text-primary transition-colors"
                >
                  {member.departmentName ?? "—"}
                </Link>
              ) : (
                "—"
              )}
            </div>
          </div>
        </div>

        {/* Site */}
        <div className="flex items-center gap-3 py-3.5 border-b border-border">
          <span className="size-[34px] rounded-[9px] bg-muted inline-flex items-center justify-center flex-none text-muted-foreground">
            <MapPin className="size-[17px]" />
          </span>
          <div>
            <div className="text-[12px] text-muted-foreground">{t("site")}</div>
            <div className="text-[14px] font-medium mt-px">{member.site ?? "—"}</div>
          </div>
        </div>

        {/* Member since */}
        <div className="flex items-center gap-3 py-3.5">
          <span className="size-[34px] rounded-[9px] bg-muted inline-flex items-center justify-center flex-none text-muted-foreground">
            <CalendarClock className="size-[17px]" />
          </span>
          <div>
            <div className="text-[12px] text-muted-foreground">{t("memberSince")}</div>
            <div className="text-[14px] font-medium mt-px">{formatDate(member.joinedAt)}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
