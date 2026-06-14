"use client";

import { useQuery } from "@apollo/client";
import {
  UserPlus,
  PencilLine,
  Trophy,
  BadgeCheck,
  Wallet,
  Ban,
  ScrollText,
  type LucideIcon,
} from "lucide-react";
import { AUDIT_LOGS_QUERY } from "@/graphql/operations";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatDateTime, relativeTime } from "@/lib/utils";
import type { Role } from "@prisma/client";

interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  actorName: string;
  actorRole: Role;
  createdAt: string;
}

const ACTION_META: Record<string, { label: string; icon: LucideIcon; tone: string }> = {
  LEAD_CREATED: { label: "Lead created", icon: UserPlus, tone: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  LEAD_UPDATED: { label: "Lead updated", icon: PencilLine, tone: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" },
  SALE_CLOSED: { label: "Sale closed", icon: Trophy, tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  COMMISSION_APPROVED: { label: "Commission approved", icon: BadgeCheck, tone: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  COMMISSION_PAID: { label: "Commission paid", icon: Wallet, tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  COMMISSION_CANCELLED: { label: "Commission cancelled", icon: Ban, tone: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
};

function metaFor(action: string) {
  return ACTION_META[action] ?? { label: action, icon: ScrollText, tone: "bg-muted text-muted-foreground" };
}

export default function AuditPage() {
  const { data, loading, error, refetch } = useQuery<{ auditLogs: AuditEntry[] }>(AUDIT_LOGS_QUERY, {
    variables: { limit: 100 },
    fetchPolicy: "cache-and-network",
  });

  const logs = data?.auditLogs ?? [];

  return (
    <>
      <PageHeader
        title="Audit Log"
        description="A chronological record of important actions across the platform."
      />

      {error && !data ? (
        <ErrorState message={error.message} onRetry={() => void refetch()} />
      ) : loading && !data ? (
        <Card className="divide-y divide-border">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </Card>
      ) : logs.length === 0 ? (
        <EmptyState icon={ScrollText} title="No activity yet" description="Actions will appear here as the team works." />
      ) : (
        <Card className="divide-y divide-border">
          {logs.map((log) => {
            const meta = metaFor(log.action);
            const Icon = meta.icon;
            return (
              <div key={log.id} className="flex items-start gap-4 p-4">
                <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", meta.tone)}>
                  <Icon className="h-[18px] w-[18px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-medium">{meta.label}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{log.entityType}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{log.summary}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground">{log.actorName}</span>
                    <StatusBadge kind="role" value={log.actorRole} />
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-medium">{relativeTime(log.createdAt)}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(log.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </>
  );
}
