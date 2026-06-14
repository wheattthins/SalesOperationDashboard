import type { User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUserFromCookieHeader } from "@/lib/auth";

export interface GraphQLContext {
  user: User | null;
  prisma: typeof prisma;
}

export async function createContext(req: Request): Promise<GraphQLContext> {
  const user = await getUserFromCookieHeader(req.headers.get("cookie"));
  return { user, prisma };
}
