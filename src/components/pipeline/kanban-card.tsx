"use client";

import { useRouter } from "next/navigation";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, MoveRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar } from "@/components/shared/avatar";
import { LEAD_STATUS_LABELS, LEAD_STATUS_ORDER, LEAD_SOURCE_LABELS } from "@/lib/constants";
import { formatCurrency, cn } from "@/lib/utils";
import type { LeadRow } from "@/types";
import type { LeadStatus, LeadSource } from "@prisma/client";

export function KanbanCard({
  lead,
  draggable,
  onMove,
}: {
  lead: LeadRow;
  draggable: boolean;
  onMove: (leadId: string, status: LeadStatus) => void;
}) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    disabled: !draggable,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(
        "group rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md",
        isDragging && "opacity-40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={() => router.push(`/leads/${lead.id}`)}
          className="min-w-0 flex-1 text-left"
        >
          <p className="truncate text-sm font-medium hover:text-primary">{lead.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {LEAD_SOURCE_LABELS[lead.source as LeadSource]}
          </p>
        </button>

        {draggable ? (
          <button
            type="button"
            className="cursor-grab touch-none rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100 active:cursor-grabbing"
            {...listeners}
            {...attributes}
            aria-label="Drag lead"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm font-semibold tabular-nums">
          {formatCurrency(lead.budget, { compact: true })}
        </span>
        <div className="flex items-center gap-1.5">
          <Avatar name={lead.assignedRep.name} color={lead.assignedRep.avatarColor} size="sm" />
          {draggable ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="rounded p-1 text-muted-foreground hover:bg-muted cursor-pointer"
                aria-label="Move lead"
              >
                <MoveRight className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Move to</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {LEAD_STATUS_ORDER.filter((s) => s !== lead.status).map((s) => (
                  <DropdownMenuItem key={s} onSelect={() => onMove(lead.id, s)}>
                    {LEAD_STATUS_LABELS[s]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>
    </div>
  );
}
