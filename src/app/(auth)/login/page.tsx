import { redirect } from "next/navigation";
import { Building2, BarChart3, KanbanSquare, ShieldCheck } from "lucide-react";
import { getSessionUser, getDemoAccounts } from "@/lib/auth";
import { LoginForm } from "./login-form";
import { LoginThemeToggle } from "./login-theme-toggle";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  const accounts = await getDemoAccounts();

  return (
    <div className="relative grid min-h-screen w-full lg:grid-cols-2">
      <LoginThemeToggle />
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-12 text-sidebar-foreground lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, oklch(0.55 0.22 264 / 0.5), transparent 45%), radial-gradient(circle at 80% 70%, oklch(0.6 0.15 190 / 0.4), transparent 40%)",
          }}
        />
        <div className="relative flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Building2 className="h-6 w-6" />
          </span>
          <div>
            <p className="font-semibold">Sales Operations</p>
            <p className="text-sm text-sidebar-muted">Home Sales Co.</p>
          </div>
        </div>

        <div className="relative space-y-6">
          <h1 className="text-3xl font-bold leading-tight">
            Run the whole sales operation from one dashboard.
          </h1>
          <ul className="space-y-4 text-sm text-sidebar-muted">
            <li className="flex items-center gap-3">
              <KanbanSquare className="h-5 w-5 text-primary" />
              CRM, lead pipeline, and deal tracking
            </li>
            <li className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-primary" />
              Revenue, conversion, and commission reporting
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Role-based access with a full audit trail
            </li>
          </ul>
        </div>

        <p className="relative text-xs text-sidebar-muted">
          Portfolio demo · Next.js · GraphQL · Prisma · TypeScript
        </p>
      </div>

      {/* Login panel */}
      <div className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl font-bold tracking-tight">Choose a role to sign in</h2>
            <p className="text-sm text-muted-foreground">
              This is a mock authentication flow. Pick any of the four roles to explore the
              dashboard — each one sees different navigation and permissions.
            </p>
          </div>
          <LoginForm accounts={accounts} />
          <p className="text-center text-xs text-muted-foreground lg:text-left">
            You can switch roles at any time from the top-right menu.
          </p>
        </div>
      </div>
    </div>
  );
}
