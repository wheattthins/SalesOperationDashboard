import type { LeadStatus, CommissionStatus, Role } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  LEAD_STATUS_LABELS,
  LEAD_STATUS_TONES,
  COMMISSION_STATUS_LABELS,
  COMMISSION_STATUS_TONES,
  ROLE_TONES,
} from "@/lib/constants";
import { ROLE_LABELS } from "@/lib/permissions";

type StatusBadgeProps =
  | { kind: "lead"; value: LeadStatus; className?: string }
  | { kind: "commission"; value: CommissionStatus; className?: string }
  | { kind: "role"; value: Role; className?: string };

/**
 * A single badge component that renders the correct label + color tone for
 * lead statuses, commission statuses, and user roles.
 */
export function StatusBadge(props: StatusBadgeProps) {
  if (props.kind === "lead") {
    return (
      <Badge className={cn(LEAD_STATUS_TONES[props.value], props.className)}>
        {LEAD_STATUS_LABELS[props.value]}
      </Badge>
    );
  }
  if (props.kind === "commission") {
    return (
      <Badge className={cn(COMMISSION_STATUS_TONES[props.value], props.className)}>
        {COMMISSION_STATUS_LABELS[props.value]}
      </Badge>
    );
  }
  return (
    <Badge className={cn(ROLE_TONES[props.value], props.className)}>{ROLE_LABELS[props.value]}</Badge>
  );
}
