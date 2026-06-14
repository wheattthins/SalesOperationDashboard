"use client";

import * as React from "react";
import { useQuery } from "@apollo/client";
import { Info } from "lucide-react";
import { PIPELINE_QUERY } from "@/graphql/operations";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { KanbanBoard } from "@/components/pipeline/kanban-board";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/components/providers/session-provider";
import type { LeadRow } from "@/types";
import type { LeadStatus } from "@prisma/client";

interface PipelineColumn {
  status: LeadStatus;
  leads: LeadRow[];
  count: number;
  value: number;
}

export default function PipelinePage() {
  const { user, can } = useSession();
  const draggable = can("edit:pipeline");
  const [moveError, setMoveError] = React.useState<string | null>(null);

  const { data, loading, error, refetch } = useQuery<{ pipeline: PipelineColumn[] }>(PIPELINE_QUERY, {
    fetchPolicy: "cache-and-network",
  });

  return (
    <>
      <PageHeader
        title="Sales Pipeline"
        description={
          user.role === "SALES_REP"
            ? "Drag your leads between stages, or use the move menu on each card."
            : "Track every lead through the deal stages. Drag cards or use the move menu."
        }
      />

      {moveError ? (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <Info className="h-4 w-4" />
          {moveError}
        </div>
      ) : null}

      {error && !data ? (
        <ErrorState message={error.message} onRetry={() => void refetch()} />
      ) : loading && !data ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-72 shrink-0 space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <KanbanBoard
          initialColumns={data?.pipeline ?? []}
          draggable={draggable}
          onError={setMoveError}
        />
      )}
    </>
  );
}
