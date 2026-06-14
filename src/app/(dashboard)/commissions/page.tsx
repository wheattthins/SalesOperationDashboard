"use client";

import * as React from "react";
import { useMutation, useQuery } from "@apollo/client";
import { type ColumnDef } from "@tanstack/react-table";
import { BadgeDollarSign, MoreHorizontal, Check, Wallet, Ban, Clock } from "lucide-react";
import {
  COMMISSIONS_QUERY,
  REPS_QUERY,
  APPROVE_COMMISSION_MUTATION,
  PAY_COMMISSION_MUTATION,
  CANCEL_COMMISSION_MUTATION,
} from "@/graphql/operations";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Avatar } from "@/components/shared/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSession } from "@/components/providers/session-provider";
import { COMMISSION_STATUS_LABELS } from "@/lib/constants";
import { formatCurrency, formatDate, formatPercent } from "@/lib/utils";
import type { CommissionStatus } from "@prisma/client";

interface CommissionRow {
  id: string;
  rate: number;
  amount: number;
  status: CommissionStatus;
  createdAt: string;
  paidAt?: string | null;
  rep: { id: string; name: string; avatarColor: string };
  sale: { id: string; salePrice: number; closedAt: string; lead: { id: string; name: string } };
  approvedBy?: { id: string; name: string } | null;
}

type ActionType = "approve" | "pay" | "cancel";

const ACTION_COPY: Record<ActionType, { title: string; description: string; confirm: string; variant: "default" | "destructive" }> = {
  approve: {
    title: "Approve commission?",
    description: "This marks the commission as approved and ready for payout.",
    confirm: "Approve",
    variant: "default",
  },
  pay: {
    title: "Mark commission as paid?",
    description: "This records the commission as paid out to the sales rep.",
    confirm: "Mark paid",
    variant: "default",
  },
  cancel: {
    title: "Cancel commission?",
    description: "This cancels the commission. It will no longer be eligible for payout.",
    confirm: "Cancel commission",
    variant: "destructive",
  },
};

export default function CommissionsPage() {
  const { can } = useSession();
  const isRep = !can("view:allCommissions");
  const canManage = can("manage:commissions");

  const [status, setStatus] = React.useState("ALL");
  const [repId, setRepId] = React.useState("ALL");
  const [action, setAction] = React.useState<{ row: CommissionRow; type: ActionType } | null>(null);

  const { data: repsData } = useQuery<{ reps: { id: string; name: string }[] }>(REPS_QUERY, {
    skip: isRep,
  });

  const { data, loading, error, refetch } = useQuery<{ commissions: CommissionRow[] }>(
    COMMISSIONS_QUERY,
    {
      variables: {
        status: status === "ALL" ? undefined : (status as CommissionStatus),
        repId: repId === "ALL" ? undefined : repId,
      },
      fetchPolicy: "cache-and-network",
    },
  );

  const [approve, { loading: approving }] = useMutation(APPROVE_COMMISSION_MUTATION);
  const [pay, { loading: paying }] = useMutation(PAY_COMMISSION_MUTATION);
  const [cancel, { loading: cancelling }] = useMutation(CANCEL_COMMISSION_MUTATION);
  const mutating = approving || paying || cancelling;

  async function runAction() {
    if (!action) return;
    const variables = { variables: { id: action.row.id } };
    if (action.type === "approve") await approve(variables);
    else if (action.type === "pay") await pay(variables);
    else await cancel(variables);
    setAction(null);
    await refetch();
  }

  const commissions = React.useMemo(() => data?.commissions ?? [], [data]);
  const totals = React.useMemo(() => {
    const sum = (s: CommissionStatus) =>
      commissions.filter((c) => c.status === s).reduce((acc, c) => acc + c.amount, 0);
    return { pending: sum("PENDING"), approved: sum("APPROVED"), paid: sum("PAID") };
  }, [commissions]);

  const columns = React.useMemo<ColumnDef<CommissionRow>[]>(() => {
    const base: ColumnDef<CommissionRow>[] = [
      {
        accessorKey: "rep",
        header: "Sales Rep",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Avatar name={row.original.rep.name} color={row.original.rep.avatarColor} size="sm" />
            <span className="text-sm font-medium">{row.original.rep.name}</span>
          </div>
        ),
      },
      {
        id: "deal",
        header: "Deal",
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-medium">{row.original.sale.lead.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(row.original.sale.salePrice)} · {formatDate(row.original.sale.closedAt)}
            </p>
          </div>
        ),
      },
      {
        accessorFn: (r) => r.rate,
        id: "rate",
        header: "Rate",
        cell: ({ row }) => <span className="text-sm tabular-nums">{formatPercent(row.original.rate)}</span>,
      },
      {
        accessorKey: "amount",
        header: "Commission",
        cell: ({ row }) => (
          <span className="font-semibold tabular-nums">{formatCurrency(row.original.amount)}</span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge kind="commission" value={row.original.status} />,
      },
    ];

    if (canManage) {
      base.push({
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const c = row.original;
          const canApprove = c.status === "PENDING";
          const canPay = c.status === "APPROVED";
          const canCancel = c.status === "PENDING" || c.status === "APPROVED";
          if (!canApprove && !canPay && !canCancel) {
            return <span className="text-xs text-muted-foreground">—</span>;
          }
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canApprove ? (
                  <DropdownMenuItem onSelect={() => setAction({ row: c, type: "approve" })}>
                    <Check className="h-4 w-4" /> Approve
                  </DropdownMenuItem>
                ) : null}
                {canPay ? (
                  <DropdownMenuItem onSelect={() => setAction({ row: c, type: "pay" })}>
                    <Wallet className="h-4 w-4" /> Mark paid
                  </DropdownMenuItem>
                ) : null}
                {canCancel ? (
                  <DropdownMenuItem
                    onSelect={() => setAction({ row: c, type: "cancel" })}
                    className="text-destructive focus:text-destructive"
                  >
                    <Ban className="h-4 w-4" /> Cancel
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      });
    }

    return base;
  }, [canManage]);

  return (
    <>
      <PageHeader
        title="Commissions"
        description={
          isRep ? "Your commission records and payout status." : "Review and process rep commissions."
        }
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <DashboardCard title="Pending" value={formatCurrency(totals.pending)} icon={Clock} accent="amber" hint="awaiting approval" />
        <DashboardCard title="Approved" value={formatCurrency(totals.approved)} icon={Check} accent="sky" hint="ready for payout" />
        <DashboardCard title="Paid" value={formatCurrency(totals.paid)} icon={Wallet} accent="emerald" hint="this dataset" />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {(Object.keys(COMMISSION_STATUS_LABELS) as CommissionStatus[]).map((s) => (
              <SelectItem key={s} value={s}>
                {COMMISSION_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!isRep ? (
          <Select value={repId} onValueChange={setRepId}>
            <SelectTrigger className="sm:w-48">
              <SelectValue placeholder="Sales rep" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All reps</SelectItem>
              {(repsData?.reps ?? []).map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>

      {error && !data ? (
        <ErrorState message={error.message} onRetry={() => void refetch()} />
      ) : (
        <DataTable
          columns={columns}
          data={commissions}
          loading={loading && !data}
          emptyState={
            <EmptyState
              icon={BadgeDollarSign}
              title="No commissions"
              description="Commissions are generated automatically when a deal is closed won."
            />
          }
        />
      )}

      <ConfirmDialog
        open={action !== null}
        onOpenChange={(o) => !o && setAction(null)}
        title={action ? ACTION_COPY[action.type].title : ""}
        description={
          action
            ? `${ACTION_COPY[action.type].description} (${formatCurrency(action.row.amount)} for ${action.row.rep.name})`
            : undefined
        }
        confirmLabel={action ? ACTION_COPY[action.type].confirm : "Confirm"}
        variant={action ? ACTION_COPY[action.type].variant : "default"}
        loading={mutating}
        onConfirm={runAction}
      />
    </>
  );
}
