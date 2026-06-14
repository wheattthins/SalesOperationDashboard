"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoleSwitcher } from "./role-switcher";
import { ThemeToggle } from "./theme-toggle";
import { NAV_ITEMS } from "./nav-config";
import { logout } from "@/lib/auth-actions";
import type { SessionUser } from "@/types";

function currentTitle(pathname: string): string {
  const match = NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  return match?.label ?? "Sales Operations";
}

export function Topbar({
  accounts,
  onMenuClick,
}: {
  accounts: SessionUser[];
  onMenuClick: () => void;
}) {
  const pathname = usePathname();
  const [pending, startTransition] = React.useTransition();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-md p-1.5 text-muted-foreground hover:bg-accent lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="text-lg font-semibold tracking-tight">{currentTitle(pathname)}</h1>

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <RoleSwitcher accounts={accounts} />
        <Button
          variant="ghost"
          size="icon"
          title="Sign out"
          disabled={pending}
          onClick={() => startTransition(() => void logout())}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
