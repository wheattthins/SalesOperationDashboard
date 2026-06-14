"use client";

import * as React from "react";
import { useMutation } from "@apollo/client";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { PIPELINE_QUERY, UPDATE_LEAD_STATUS_MUTATION } from "@/graphql/operations";
import { KanbanCard } from "./kanban-card";
import { LEAD_STATUS_LABELS, LEAD_STATUS_ORDER, LEAD_STATUS_TONES } from "@/lib/constants";
import { formatCurrency, cn } from "@/lib/utils";
import type { LeadRow } from "@/types";
import type { LeadStatus } from "@prisma/client";

interface Column {
  status: LeadStatus;
  leads: LeadRow[];
  count: number;
  value: number;
}

function KanbanColumn({
  column,
  draggable,
  onMove,
}: {
  column: Column;
  draggable: boolean;
  onMove: (leadId: string, status: LeadStatus) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.status });

  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", LEAD_STATUS_TONES[column.status].split(" ")[0])} />
          <span className="text-sm font-semibold">{LEAD_STATUS_LABELS[column.status]}</span>
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            {column.count}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {formatCurrency(column.value, { compact: true })}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-32 flex-1 flex-col gap-2 rounded-xl border border-dashed border-transparent bg-muted/40 p-2 transition-colors",
          isOver && "border-primary/50 bg-primary/5",
        )}
      >
        {column.leads.map((lead) => (
          <KanbanCard key={lead.id} lead={lead} draggable={draggable} onMove={onMove} />
        ))}
        {column.leads.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">No leads</p>
        ) : null}
      </div>
    </div>
  );
}

export function KanbanBoard({
  initialColumns,
  draggable,
  onError,
}: {
  initialColumns: Column[];
  draggable: boolean;
  onError: (message: string) => void;
}) {
  const [columns, setColumns] = React.useState<Column[]>(initialColumns);
  const [activeLead, setActiveLead] = React.useState<LeadRow | null>(null);
  const [updateStatus] = useMutation(UPDATE_LEAD_STATUS_MUTATION);
  const [pendingMoves, setPendingMoves] = React.useState(0);

  // Sync server data only when the pipeline actually changed and no moves are
  // in flight — avoids overwriting optimistic state and duplicate cards.
  const [syncedSignature, setSyncedSignature] = React.useState(() =>
    columnsSignature(initialColumns),
  );
  const incomingSignature = columnsSignature(initialColumns);
  if (pendingMoves === 0 && incomingSignature !== syncedSignature) {
    setSyncedSignature(incomingSignature);
    setColumns(initialColumns);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const moveLead = React.useCallback(
    async (leadId: string, newStatus: LeadStatus) => {
      let moved = false;
      let snapshot: Column[] = [];

      setColumns((cols) => {
        const lead = cols.flatMap((c) => c.leads).find((l) => l.id === leadId);
        if (!lead || lead.status === newStatus) return cols;
        moved = true;
        snapshot = cols;
        return moveLeadBetweenColumns(cols, leadId, lead, newStatus);
      });

      if (!moved) return;

      setPendingMoves((n) => n + 1);
      try {
        await updateStatus({
          variables: { id: leadId, status: newStatus },
          refetchQueries: [{ query: PIPELINE_QUERY }],
        });
      } catch (err) {
        setColumns(snapshot);
        onError(err instanceof Error ? err.message : "Failed to move lead");
      } finally {
        setPendingMoves((n) => n - 1);
      }
    },
    [onError, updateStatus],
  );

  function handleDragStart(event: DragStartEvent) {
    const leadId = String(event.active.id);
    const lead = columns.flatMap((c) => c.leads).find((l) => l.id === leadId) ?? null;
    setActiveLead(lead);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveLead(null);
    const { active, over } = event;
    if (!over) return;

    const overId = String(over.id);
    const newStatus = LEAD_STATUS_ORDER.includes(overId as LeadStatus)
      ? (overId as LeadStatus)
      : columns.find((col) => col.leads.some((l) => l.id === overId))?.status;

    if (newStatus) {
      void moveLead(String(active.id), newStatus);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveLead(null)}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
        {columns.map((column) => (
          <KanbanColumn key={column.status} column={column} draggable={draggable} onMove={moveLead} />
        ))}
      </div>
      <DragOverlay>
        {activeLead ? (
          <div className="w-64 rotate-2 rounded-lg border border-primary/40 bg-card p-3 shadow-lg">
            <p className="truncate text-sm font-medium">{activeLead.name}</p>
            <p className="text-sm font-semibold">{formatCurrency(activeLead.budget, { compact: true })}</p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

/** Stable fingerprint so we only re-sync when server pipeline data actually changes. */
function columnsSignature(columns: Column[]): string {
  return columns
    .map((col) => `${col.status}:${col.leads.map((l) => `${l.id}:${l.status}`).join(",")}`)
    .join("|");
}

/** Remove a lead from every column by id, then insert once in the target column. */
function moveLeadBetweenColumns(
  cols: Column[],
  leadId: string,
  lead: LeadRow,
  newStatus: LeadStatus,
): Column[] {
  const stripped = cols.map((col) => ({
    ...col,
    leads: col.leads.filter((l) => l.id !== leadId),
  }));
  return recompute(
    stripped.map((col) =>
      col.status === newStatus
        ? { ...col, leads: [{ ...lead, status: newStatus }, ...col.leads] }
        : col,
    ),
  );
}

function recompute(columns: Column[]): Column[] {
  return columns.map((col) => ({
    ...col,
    count: col.leads.length,
    value: col.leads.reduce((s, l) => s + l.budget, 0),
  }));
}
