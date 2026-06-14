"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar } from "@/components/shared/avatar";
import { StatusBadge } from "@/components/shared/status-badge";
import { useSession } from "@/components/providers/session-provider";
import { loginAs } from "@/lib/auth-actions";
import type { SessionUser } from "@/types";
import { ROLE_LABELS } from "@/lib/permissions";

/**
 * Lets you instantly re-authenticate as any of the demo accounts to explore
 * how each role's permissions and navigation differ.
 */
export function RoleSwitcher({ accounts }: { accounts: SessionUser[] }) {
  const { user } = useSession();
  const [pending, startTransition] = React.useTransition();

  function switchTo(id: string) {
    startTransition(() => {
      void loginAs(id);
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm shadow-sm transition-colors hover:bg-accent cursor-pointer disabled:opacity-60"
        disabled={pending}
      >
        <Avatar name={user.name} color={user.avatarColor} size="sm" />
        <span className="hidden text-left sm:block">
          <span className="block text-xs font-medium leading-tight">{user.name}</span>
          <span className="block text-[11px] leading-tight text-muted-foreground">
            {ROLE_LABELS[user.role]}
          </span>
        </span>
        <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Switch demo account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {accounts.map((account) => (
          <DropdownMenuItem
            key={account.id}
            onSelect={() => switchTo(account.id)}
            className="gap-2.5 py-2"
          >
            <Avatar name={account.name} color={account.avatarColor} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{account.name}</p>
              <p className="truncate text-xs text-muted-foreground">{ROLE_LABELS[account.role]}</p>
            </div>
            {account.id === user.id ? <Check className="h-4 w-4 text-primary" /> : null}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5">
          <StatusBadge kind="role" value={user.role} />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
