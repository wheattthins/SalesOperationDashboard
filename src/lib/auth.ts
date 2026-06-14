import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";

export const SESSION_COOKIE = "sod_session";

/**
 * Reads the mock session cookie (a user id) and loads the user. Returns null
 * when there is no valid session. Used by server components and the GraphQL
 * context to identify the "logged in" user.
 */
export async function getSessionUser(): Promise<User | null> {
  const store = await cookies();
  const userId = store.get(SESSION_COOKIE)?.value;
  if (!userId) return null;
  try {
    return await prisma.user.findUnique({ where: { id: userId } });
  } catch {
    return null;
  }
}

/**
 * One representative account per role, used to populate the login screen and
 * the in-app role switcher.
 */
export async function getDemoAccounts(): Promise<User[]> {
  const roles = ["ADMIN", "SALES_MANAGER", "SALES_REP", "FINANCE"] as const;
  const accounts: User[] = [];
  for (const role of roles) {
    const user = await prisma.user.findFirst({ where: { role }, orderBy: { createdAt: "asc" } });
    if (user) accounts.push(user);
  }
  return accounts;
}

export async function getUserFromCookieHeader(cookieHeader: string | null): Promise<User | null> {
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${SESSION_COOKIE}=`));
  if (!match) return null;
  const userId = decodeURIComponent(match.split("=")[1] ?? "");
  if (!userId) return null;
  try {
    return await prisma.user.findUnique({ where: { id: userId } });
  } catch {
    return null;
  }
}
