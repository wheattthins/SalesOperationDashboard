"use client";

import * as React from "react";
import type { SessionUser } from "@/types";
import { can as checkPermission, type Permission } from "@/lib/permissions";

interface SessionContextValue {
  user: SessionUser;
  can: (permission: Permission) => boolean;
}

const SessionContext = React.createContext<SessionContextValue | null>(null);

export function SessionProvider({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const value = React.useMemo<SessionContextValue>(
    () => ({ user, can: (permission) => checkPermission(user.role, permission) }),
    [user],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = React.useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return ctx;
}
