export type MemberRole = "admin" | "member";
export type MemberStatus = "active" | "invited" | "deactivated";

export interface MemberRow {
  id: string;
  authUserId: string | null;
  name: string;
  email: string;
  phone: string | null;
  role: MemberRole;
  status: MemberStatus;
  joinedAt: string | null;
  lastActiveAt: string | null;
  isSelf: boolean;
}

export function relativeLastActive(iso: string | null, now: Date = new Date()): string {
  if (!iso) return "—";
  const diff = now.getTime() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "Active now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day} day${day === 1 ? "" : "s"} ago`;
  const wk = Math.round(day / 7);
  return `${wk} week${wk === 1 ? "" : "s"} ago`;
}

export function deriveInitials(s: string): string {
  const parts = s.replace(/@.+$/, "").split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
