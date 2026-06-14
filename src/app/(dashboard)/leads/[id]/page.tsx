"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@apollo/client";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Wallet,
  Pencil,
  Tag,
  UserRound,
  Trophy,
} from "lucide-react";
import { LEAD_QUERY } from "@/graphql/operations";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Avatar } from "@/components/shared/avatar";
import { RoleGate } from "@/components/shared/role-gate";
import { ErrorState } from "@/components/shared/error-state";
import { LeadFormDialog } from "@/components/leads/lead-form-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LEAD_SOURCE_LABELS } from "@/lib/constants";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { LeadRow } from "@/types";
import type { LeadSource } from "@prisma/client";

interface LeadDetail extends LeadRow {
  sale?: {
    id: string;
    salePrice: number;
    closedAt: string;
    commission?: { id: string; amount: number; status: string } | null;
  } | null;
}

function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="text-sm font-medium">{children}</div>
      </div>
    </div>
  );
}

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [editOpen, setEditOpen] = React.useState(false);

  const { data, loading, error, refetch } = useQuery<{ lead: LeadDetail | null }>(LEAD_QUERY, {
    variables: { id: params.id },
    fetchPolicy: "cache-and-network",
  });

  const lead = data?.lead;

  if (loading && !lead) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-40" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <>
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link href="/leads">
            <ArrowLeft className="h-4 w-4" />
            Back to leads
          </Link>
        </Button>
        <ErrorState
          title="Lead not available"
          message={error?.message ?? "This lead could not be found or you don't have access."}
          onRetry={() => void refetch()}
        />
      </>
    );
  }

  return (
    <>
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => router.push("/leads")}>
        <ArrowLeft className="h-4 w-4" />
        Back to leads
      </Button>

      <PageHeader
        title={lead.name}
        description={lead.email}
        action={
          <RoleGate permission="edit:leads">
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          </RoleGate>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Lead details</CardTitle>
            <StatusBadge kind="lead" value={lead.status as never} />
          </CardHeader>
          <CardContent>
            <div className="grid gap-x-8 sm:grid-cols-2">
              <DetailRow icon={Mail} label="Email">
                <a href={`mailto:${lead.email}`} className="hover:text-primary">
                  {lead.email}
                </a>
              </DetailRow>
              <DetailRow icon={Phone} label="Phone">
                <a href={`tel:${lead.phone}`} className="hover:text-primary">
                  {lead.phone}
                </a>
              </DetailRow>
              <DetailRow icon={Tag} label="Source">
                {LEAD_SOURCE_LABELS[lead.source as LeadSource]}
              </DetailRow>
              <DetailRow icon={Wallet} label="Budget">
                {formatCurrency(lead.budget)}
              </DetailRow>
              <DetailRow icon={UserRound} label="Assigned rep">
                <span className="inline-flex items-center gap-2">
                  <Avatar name={lead.assignedRep.name} color={lead.assignedRep.avatarColor} size="sm" />
                  {lead.assignedRep.name}
                </span>
              </DetailRow>
              <DetailRow icon={Calendar} label="Created">
                {formatDateTime(lead.createdAt)}
              </DetailRow>
            </div>

            {lead.notes ? (
              <div className="mt-4 rounded-lg border border-border bg-muted/40 p-4">
                <p className="mb-1 text-xs font-medium text-muted-foreground">Notes</p>
                <p className="text-sm">{lead.notes}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Deal status</CardTitle>
          </CardHeader>
          <CardContent>
            {lead.sale ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-emerald-700 dark:text-emerald-400">
                  <Trophy className="h-4 w-4" />
                  <span className="text-sm font-medium">Closed Won</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Sale price</span>
                  <span className="font-semibold">{formatCurrency(lead.sale.salePrice)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Closed on</span>
                  <span>{formatDateTime(lead.sale.closedAt)}</span>
                </div>
                {lead.sale.commission ? (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Commission</span>
                    <span className="inline-flex items-center gap-2">
                      {formatCurrency(lead.sale.commission.amount)}
                      <StatusBadge kind="commission" value={lead.sale.commission.status as never} />
                    </span>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                This lead is still in the pipeline. Move it to{" "}
                <span className="font-medium text-foreground">Closed Won</span> to record a sale and
                generate a commission.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <LeadFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        lead={lead}
        onSaved={() => void refetch()}
      />
    </>
  );
}
