import { Card } from "@/components/ui/card";
import type { ActivityItem } from "@/features/activity/api/list-recent-activity";

const ACTION_VERB: Record<ActivityItem["action"], string> = {
  insert: "registered",
  update: "updated",
  delete: "removed",
  restore: "restored",
};

const ENTITY_LABEL: Record<string, string> = {
  devices: "device",
  groups: "group",
  units: "unit",
  manufacturers: "manufacturer",
  users: "member",
};

function relativeTime(iso: string, now: Date = new Date()): string {
  const diffMs = now.getTime() - new Date(iso).getTime();
  const sec = Math.round(diffMs / 1000);
  if (sec < 60) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day} day${day === 1 ? "" : "s"} ago`;
  const wk = Math.round(day / 7);
  return `${wk} week${wk === 1 ? "" : "s"} ago`;
}

export function ActivityCard({ activity }: { activity: ActivityItem[] }) {
  const items = activity.slice(0, 8);
  const sixHoursAgo = Date.now() - 6 * 60 * 60 * 1000;

  return (
    <Card className="shadow-none gap-0">
      <div className="px-5 pt-[18px] pb-0">
        <div className="text-[15px] font-semibold tracking-[-0.01em]">
          Recent activity
        </div>
      </div>
      <div className="px-5 pt-[18px] pb-5">
        {items.length === 0 ? (
          <div className="text-[13px] text-muted-foreground py-2">
            No activity yet.
          </div>
        ) : (
          <ol className="relative pt-1">
            {items.map((a, i) => {
              const active = new Date(a.created_at).getTime() > sixHoursAgo;
              const isLast = i === items.length - 1;
              const entityName = ENTITY_LABEL[a.entity_type] ?? a.entity_type;
              const verb = ACTION_VERB[a.action];
              const actor = a.actor_name ?? "Someone";
              const label = a.entity_label ?? "—";
              return (
                <li key={a.id} className="relative pl-[26px] pb-[18px] last:pb-0">
                  {!isLast ? (
                    <span
                      className="absolute left-[5px] top-4 bottom-[-2px] w-px bg-border"
                      aria-hidden
                    />
                  ) : null}
                  <span
                    className={
                      active
                        ? "absolute left-0 top-1 size-[11px] rounded-full bg-card border-2 border-primary"
                        : "absolute left-0 top-1 size-[11px] rounded-full bg-card border-2 border-muted-foreground"
                    }
                    aria-hidden
                  />
                  <div className="text-[13px] leading-snug">
                    {actor} {verb} {entityName} <b className="font-semibold">{label}</b>
                  </div>
                  <div className="text-[11.5px] text-muted-foreground mt-0.5">
                    {relativeTime(a.created_at)}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </Card>
  );
}
