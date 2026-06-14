"use client";

import type { Role } from "@prisma/client";
import { useSession } from "@/components/providers/session-provider";
import type { Permission } from "@/lib/permissions";

/**
 * Conditionally renders children based on the current user's role/permission.
 * Pass either a `permission` (checked against the matrix) or an explicit list
 * of allowed `roles`. Optionally render a `fallback` when access is denied.
 */
export function RoleGate({
  permission,
  roles,
  fallback = null,
  children,
}: {
  permission?: Permission;
  roles?: Role[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { user, can } = useSession();

  const allowed =
    (permission ? can(permission) : true) && (roles ? roles.includes(user.role) : true);

  return <>{allowed ? children : fallback}</>;
}
