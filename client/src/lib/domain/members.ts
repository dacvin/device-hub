import { z } from "zod";
import type { Database } from "@/types/database.types";

export type MemberRow = Database["public"]["Tables"]["member"]["Row"];
export type MemberRole = MemberRow["role"];
export type MemberStatus = MemberRow["status"];

export interface Member {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  status: MemberStatus;
  departmentId: string | null;
  departmentName: string | null;
  site: string | null;
  phone: string | null;
  reportsTo: string | null;
  reportsToName: string | null;
  joinedAt: string | null;
  lastActiveAt: string | null;
  invitedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export const ROLE_LABEL: Record<MemberRole, string> = {
  it_admin: "IT Admin",
  manager: "Manager",
  viewer: "Viewer",
};

export const ROLE_TONE: Record<MemberRole, "primary" | "secondary" | "muted"> = {
  it_admin: "primary",
  manager: "secondary",
  viewer: "muted",
};

export type Capability =
  | "viewInventory"
  | "manageOwnDept"
  | "manageAllDevices"
  | "manageCatalogs"
  | "exportData"
  | "manageMembers"
  | "changeSettings";

export const CAPABILITIES: Record<MemberRole, Record<Capability, boolean>> = {
  it_admin: {
    viewInventory: true, manageOwnDept: true, manageAllDevices: true,
    manageCatalogs: true, exportData: true, manageMembers: true, changeSettings: true,
  },
  manager: {
    viewInventory: true, manageOwnDept: true, manageAllDevices: false,
    manageCatalogs: false, exportData: true, manageMembers: false, changeSettings: false,
  },
  viewer: {
    viewInventory: true, manageOwnDept: false, manageAllDevices: false,
    manageCatalogs: false, exportData: false, manageMembers: false, changeSettings: false,
  },
};

export function can(role: MemberRole, capability: Capability): boolean {
  return CAPABILITIES[role][capability];
}

type MemberJoinedRow = MemberRow & {
  department: { name: string } | null;
  reports_to_member: { name: string } | null;
};

export function mapMemberRow(row: MemberJoinedRow): Member {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
    departmentId: row.department_id,
    departmentName: row.department?.name ?? null,
    site: row.site,
    phone: row.phone,
    reportsTo: row.reports_to,
    reportsToName: row.reports_to_member?.name ?? null,
    joinedAt: row.joined_at,
    lastActiveAt: row.last_active_at,
    invitedBy: row.invited_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const inviteMemberSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().regex(/@sioux\.asia$/i, "Email must be a @sioux.asia address"),
  role: z.enum(["it_admin", "manager", "viewer"]),
  departmentId: z.string().uuid().nullable(),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
