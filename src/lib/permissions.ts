import type { Role } from "@prisma/client";

/**
 * Central permission matrix. Each role maps to a set of capabilities that
 * the UI (RoleGate, nav) and GraphQL resolvers both consult, so access rules
 * stay consistent across the stack.
 */
export type Permission =
  | "view:dashboard"
  | "view:leads"
  | "edit:leads"
  | "view:pipeline"
  | "edit:pipeline"
  | "view:commissions"
  | "view:allCommissions"
  | "manage:commissions"
  | "view:reports"
  | "view:audit";

const MATRIX: Record<Role, Permission[]> = {
  ADMIN: [
    "view:dashboard",
    "view:leads",
    "edit:leads",
    "view:pipeline",
    "edit:pipeline",
    "view:commissions",
    "view:allCommissions",
    "manage:commissions",
    "view:reports",
    "view:audit",
  ],
  SALES_MANAGER: [
    "view:dashboard",
    "view:leads",
    "edit:leads",
    "view:pipeline",
    "edit:pipeline",
    "view:commissions",
    "view:allCommissions",
    "view:reports",
    "view:audit",
  ],
  SALES_REP: [
    "view:dashboard",
    "view:leads",
    "edit:leads",
    "view:pipeline",
    "edit:pipeline",
    "view:commissions",
  ],
  FINANCE: [
    "view:dashboard",
    "view:commissions",
    "view:allCommissions",
    "manage:commissions",
    "view:reports",
    "view:audit",
  ],
};

export function can(role: Role | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  return MATRIX[role]?.includes(permission) ?? false;
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admin",
  SALES_MANAGER: "Sales Manager",
  SALES_REP: "Sales Representative",
  FINANCE: "Finance",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  ADMIN: "Full access to every module and setting.",
  SALES_MANAGER: "Oversees the whole team, pipeline, and reports.",
  SALES_REP: "Manages their own leads, pipeline, and commissions.",
  FINANCE: "Approves and pays out commissions.",
};
