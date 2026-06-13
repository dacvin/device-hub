import { KeyRound, Check, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import type { MemberRole, Capability } from "@/lib/domain/members";
import { CAPABILITIES } from "@/lib/domain/members";
import { cn } from "@/lib/utils";

const CAPABILITIES_ORDER: Capability[] = [
  "viewInventory",
  "manageOwnDept",
  "manageAllDevices",
  "manageCatalogs",
  "exportData",
  "manageMembers",
  "changeSettings",
];

interface PermissionsCardProps {
  role: MemberRole;
}

export function PermissionsCard({ role }: PermissionsCardProps) {
  const t = useTranslations("memberProfile");
  const caps = CAPABILITIES[role];

  return (
    <Card className="p-[22px]">
      <div className="text-[13px] font-semibold tracking-[0.04em] uppercase text-muted-foreground flex items-center gap-2">
        <KeyRound className="size-[15px] text-primary" />
        {t("permissionsTitle")}
      </div>
      <div className="mt-3">
        {CAPABILITIES_ORDER.map((cap, i) => {
          const allowed = caps[cap];
          return (
            <div
              key={cap}
              className={cn(
                "flex items-center gap-[11px] py-[11px] text-[14px]",
                i < CAPABILITIES_ORDER.length - 1 && "border-b border-border",
                !allowed && "text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "size-[22px] rounded-[7px] inline-flex items-center justify-center flex-none",
                  allowed
                    ? "bg-[color-mix(in_oklch,var(--green-200)_55%,var(--card))] text-[var(--green-700)] dark:bg-[color-mix(in_oklch,var(--green-800)_40%,var(--card))] dark:text-[var(--green-300)]"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {allowed ? (
                  <Check className="size-[13px]" />
                ) : (
                  <Minus className="size-[13px]" />
                )}
              </span>
              {t(`permissions.${cap}` as Parameters<typeof t>[0])}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
