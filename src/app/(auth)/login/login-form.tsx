"use client";

import * as React from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Avatar } from "@/components/shared/avatar";
import { loginAs } from "@/lib/auth-actions";
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from "@/lib/permissions";
import { ROLE_TONES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/types";

export function LoginForm({ accounts }: { accounts: SessionUser[] }) {
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [, startTransition] = React.useTransition();

  function signIn(id: string) {
    setPendingId(id);
    startTransition(() => {
      void loginAs(id);
    });
  }

  return (
    <div className="grid gap-3">
      {accounts.map((account) => {
        const pending = pendingId === account.id;
        return (
          <button
            key={account.id}
            type="button"
            onClick={() => signIn(account.id)}
            disabled={pendingId !== null}
            className={cn(
              "group flex items-center gap-4 rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-all hover:border-primary/40 hover:shadow-md disabled:opacity-60 cursor-pointer",
              pending && "border-primary/60 ring-2 ring-primary/20",
            )}
          >
            <Avatar name={account.name} color={account.avatarColor} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{ROLE_LABELS[account.role]}</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset",
                    ROLE_TONES[account.role],
                  )}
                >
                  {account.name}
                </span>
              </div>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {ROLE_DESCRIPTIONS[account.role]}
              </p>
            </div>
            {pending ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : (
              <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            )}
          </button>
        );
      })}
    </div>
  );
}
