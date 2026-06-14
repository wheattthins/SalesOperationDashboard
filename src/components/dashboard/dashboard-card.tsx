import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  trend?: { value: string; positive: boolean };
  accent?: "primary" | "emerald" | "amber" | "sky";
  loading?: boolean;
}

const ACCENTS: Record<NonNullable<DashboardCardProps["accent"]>, string> = {
  primary: "bg-primary/10 text-primary",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
};

/** KPI summary card used across the dashboard. */
export function DashboardCard({
  title,
  value,
  icon: Icon,
  hint,
  trend,
  accent = "primary",
  loading = false,
}: DashboardCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {loading ? (
            <Skeleton className="h-8 w-28" />
          ) : (
            <p className="text-2xl font-bold tracking-tight tabular-nums">{value}</p>
          )}
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", ACCENTS[accent])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {(hint || trend) && !loading ? (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {trend ? (
            <span
              className={cn(
                "font-medium",
                trend.positive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
              )}
            >
              {trend.value}
            </span>
          ) : null}
          {hint ? <span className="text-muted-foreground">{hint}</span> : null}
        </div>
      ) : null}
    </Card>
  );
}
