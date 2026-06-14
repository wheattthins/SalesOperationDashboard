"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@apollo/client";
import { type ColumnDef } from "@tanstack/react-table";
import { Plus, Search, Users } from "lucide-react";
import { LEADS_QUERY, REPS_QUERY } from "@/graphql/operations";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { Pagination } from "@/components/data-table/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { Avatar } from "@/components/shared/avatar";
import { RoleGate } from "@/components/shared/role-gate";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LeadFormDialog } from "@/components/leads/lead-form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSession } from "@/components/providers/session-provider";
import { LEAD_SOURCE_LABELS, LEAD_STATUS_LABELS, LEAD_STATUS_ORDER } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { LeadRow } from "@/types";
import type { LeadStatus, LeadSource } from "@prisma/client";

const PAGE_SIZE = 10;

export default function LeadsPage() {
  const router = useRouter();
  const { user } = useSession();
  const isRep = user.role === "SALES_REP";

  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<string>("ALL");
  const [repId, setRepId] = React.useState<string>("ALL");
  const [page, setPage] = React.useState(1);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  // Debounce the search input.
  React.useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data: repsData } = useQuery<{ reps: { id: string; name: string }[] }>(REPS_QUERY, {
    skip: isRep,
  });

  const { data, loading, error, refetch } = useQuery<{
    leads: { items: LeadRow[]; total: number; page: number; totalPages: number; pageSize: number };
  }>(LEADS_QUERY, {
    variables: {
      search: search || undefined,
      status: status === "ALL" ? undefined : (status as LeadStatus),
      repId: repId === "ALL" ? undefined : repId,
      page,
      pageSize: PAGE_SIZE,
    },
    fetchPolicy: "cache-and-network",
  });

  const columns = React.useMemo<ColumnDef<LeadRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Lead",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="font-medium">{row.original.name}</p>
            <p className="truncate text-xs text-muted-foreground">{row.original.email}</p>
          </div>
        ),
      },
      {
        accessorKey: "source",
        header: "Source",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {LEAD_SOURCE_LABELS[row.original.source as LeadSource]}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge kind="lead" value={row.original.status as LeadStatus} />,
      },
      {
        accessorKey: "assignedRep",
        header: "Assigned Rep",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Avatar
              name={row.original.assignedRep.name}
              color={row.original.assignedRep.avatarColor}
              size="sm"
            />
            <span className="text-sm">{row.original.assignedRep.name}</span>
          </div>
        ),
      },
      {
        accessorKey: "budget",
        header: "Budget",
        cell: ({ row }) => (
          <span className="font-medium tabular-nums">{formatCurrency(row.original.budget)}</span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{formatDate(row.original.createdAt)}</span>
        ),
      },
    ],
    [],
  );

  const leads = data?.leads;

  return (
    <>
      <PageHeader
        title="Leads"
        description={isRep ? "Your assigned leads." : "Every prospect across the team."}
        action={
          <RoleGate permission="edit:leads">
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              New Lead
            </Button>
          </RoleGate>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="pl-9"
          />
        </div>

        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {LEAD_STATUS_ORDER.map((s) => (
              <SelectItem key={s} value={s}>
                {LEAD_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {!isRep ? (
          <Select
            value={repId}
            onValueChange={(v) => {
              setRepId(v);
              setPage(1);
            }}
          >
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

      {error && !leads ? (
        <ErrorState message={error.message} onRetry={() => void refetch()} />
      ) : (
        <div className="space-y-4">
          <DataTable
            columns={columns}
            data={leads?.items ?? []}
            loading={loading && !leads}
            onRowClick={(row) => router.push(`/leads/${row.id}`)}
            emptyState={
              <EmptyState
                icon={Users}
                title="No leads found"
                description={
                  search || status !== "ALL" || repId !== "ALL"
                    ? "Try adjusting your search or filters."
                    : "Create your first lead to get started."
                }
              />
            }
          />
          {leads && leads.total > 0 ? (
            <Pagination
              page={leads.page}
              totalPages={leads.totalPages}
              total={leads.total}
              pageSize={leads.pageSize}
              onPageChange={setPage}
            />
          ) : null}
        </div>
      )}

      <LeadFormDialog open={dialogOpen} onOpenChange={setDialogOpen} onSaved={() => void refetch()} />
    </>
  );
}
