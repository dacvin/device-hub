import { ShieldCheck, UserCog, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface RoleSummaryRowProps {
  adminCount: number;
  managerCount: number;
  viewerCount: number;
  labels: {
    admins: string;
    managers: string;
    viewers: string;
    capAdmin: string;
    capManager: string;
    capViewer: string;
  };
}

interface RoleCardProps {
  icon: React.ReactNode;
  count: number;
  label: string;
  description: string;
  iconClass: string;
}

function RoleCard({ icon, count, label, description, iconClass }: RoleCardProps) {
  return (
    <Card className="px-[18px] py-4 flex items-center gap-[14px]">
      <span
        className={cn(
          "size-10 rounded-[11px] flex items-center justify-center flex-none",
          iconClass
        )}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-[22px] font-semibold leading-none tabular-nums">{count}</div>
        <div className="text-[13px] font-medium mt-1">{label}</div>
        <div className="text-[12px] text-muted-foreground mt-0.5 leading-snug">{description}</div>
      </div>
    </Card>
  );
}

export function RoleSummaryRow({ adminCount, managerCount, viewerCount, labels }: RoleSummaryRowProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
      <RoleCard
        icon={<ShieldCheck className="size-[19px]" aria-hidden />}
        count={adminCount}
        label={labels.admins}
        description={labels.capAdmin}
        iconClass="bg-secondary text-secondary-foreground"
      />
      <RoleCard
        icon={<UserCog className="size-[19px]" aria-hidden />}
        count={managerCount}
        label={labels.managers}
        description={labels.capManager}
        iconClass="bg-secondary text-secondary-foreground"
      />
      <RoleCard
        icon={<Eye className="size-[19px]" aria-hidden />}
        count={viewerCount}
        label={labels.viewers}
        description={labels.capViewer}
        iconClass="bg-secondary text-secondary-foreground"
      />
    </div>
  );
}
