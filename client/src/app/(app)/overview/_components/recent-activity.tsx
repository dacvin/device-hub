import { Card } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import { type Activity, ACTIVITY_META } from "@/lib/domain/activity";

export async function RecentActivityList({ items, title }: { items: Activity[]; title: string }) {
  const t = await getTranslations("activity");
  return (
    <Card>
      <div className="px-5 pt-[18px] pb-0">
        <div className="text-[15px] font-semibold tracking-tight">{title}</div>
      </div>
      <div className="px-5 pt-[18px] pb-5">
        {items.length === 0 ? (
          <p className="text-[13px] text-muted-foreground text-center py-4">No recent activity yet.</p>
        ) : null}
        <div className="relative pt-1">
          {items.map((a, i) => {
            const meta = ACTIVITY_META[a.action];
            const isLast = i === items.length - 1;
            return (
              <div key={a.id} className="relative pl-[26px] pb-[18px] last:pb-0">
                {!isLast && (
                  <span className="absolute left-[5px] top-4 bottom-[-2px] w-px bg-border" />
                )}
                <span className="absolute left-0 top-1 size-[11px] rounded-full bg-card border-2 border-primary" />
                <div className="text-[13px] leading-snug">
                  <span className="font-semibold">{a.actorName ?? "System"}</span>{" "}
                  <span className="text-muted-foreground">{t(meta.verbKey as Parameters<typeof t>[0])}</span>{" "}
                  {a.entityLabel ? <span className="font-semibold">{a.entityLabel}</span> : null}
                </div>
                <div className="text-[11.5px] text-muted-foreground mt-0.5">
                  {new Date(a.createdAt).toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
