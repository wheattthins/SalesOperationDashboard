import { redirect } from "next/navigation";
import { getSessionUser, getDemoAccounts } from "@/lib/auth";
import { AppApolloProvider } from "@/components/providers/apollo-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { AppShell } from "@/components/layout/app-shell";
import type { SessionUser } from "@/types";

function toSessionUser(user: {
  id: string;
  name: string;
  email: string;
  role: SessionUser["role"];
  commissionRate: number;
  avatarColor: string;
}): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    commissionRate: user.commissionRate,
    avatarColor: user.avatarColor,
  };
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const accounts = await getDemoAccounts();

  return (
    <AppApolloProvider>
      <SessionProvider user={toSessionUser(user)}>
        <AppShell accounts={accounts.map(toSessionUser)}>{children}</AppShell>
      </SessionProvider>
    </AppApolloProvider>
  );
}
