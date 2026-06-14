"use client";

import { useQuery } from "@apollo/client";
import { Download, BarChart3 } from "lucide-react";
import { REPORTS_QUERY } from "@/graphql/operations";
import { PageHeader } from "@/components/shared/page-header";
import { ChartCard } from "@/components/dashboard/chart-card";
import { MonthlyRevenueChart, TopRepsChart } from "@/components/dashboard/charts";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { Avatar } from "@/components/shared/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { exportToCsv } from "@/lib/export";

interface ReportsData {
  reports: {
    monthlyRevenue: { month: string; revenue: number; deals: number }[];
    revenueByRep: {
      rep: { id: string; name: string; avatarColor: string };
      revenue: number;
      deals: number;
      commission: number;
    }[];
    payouts: {
      rep: { id: string; name: string; avatarColor: string };
      pending: number;
      approved: number;
      paid: number;
      total: number;
    }[];
  };
}

function ExportButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="outline" size="sm" onClick={onClick}>
      <Download className="h-4 w-4" />
      Export CSV
    </Button>
  );
}

export default function ReportsPage() {
  const { data, loading, error, refetch } = useQuery<ReportsData>(REPORTS_QUERY, {
    fetchPolicy: "cache-and-network",
  });

  const reports = data?.reports;

  if (error && !reports) {
    return (
      <>
        <PageHeader title="Reports" />
        <ErrorState message={error.message} onRetry={() => void refetch()} />
      </>
    );
  }

  const isLoading = loading && !reports;

  return (
    <>
      <PageHeader title="Reports" description="Sales performance, revenue, and commission payouts." />

      <div className="space-y-4">
        <ChartCard
          title="Monthly Sales Report"
          description="Closed-deal revenue and deal count by month"
          action={
            reports ? (
              <ExportButton
                onClick={() =>
                  exportToCsv(
                    "monthly-sales-report.csv",
                    reports.monthlyRevenue.map((m) => ({
                      Month: m.month,
                      Revenue: m.revenue,
                      Deals: m.deals,
                    })),
                  )
                }
              />
            ) : null
          }
        >
          {isLoading ? (
            <Skeleton className="h-[260px] w-full" />
          ) : reports && reports.monthlyRevenue.some((m) => m.revenue > 0) ? (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <MonthlyRevenueChart data={reports.monthlyRevenue} />
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Deals</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.monthlyRevenue.map((m) => (
                    <TableRow key={m.month}>
                      <TableCell className="font-medium">{m.month}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(m.revenue, { compact: true })}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{m.deals}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState icon={BarChart3} title="No sales data" className="h-[260px]" />
          )}
        </ChartCard>

        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard
            title="Revenue by Sales Rep"
            description="Total closed revenue per representative"
            action={
              reports ? (
                <ExportButton
                  onClick={() =>
                    exportToCsv(
                      "revenue-by-rep.csv",
                      reports.revenueByRep.map((r) => ({
                        Rep: r.rep.name,
                        Deals: r.deals,
                        Revenue: r.revenue,
                        Commission: r.commission,
                      })),
                    )
                  }
                />
              ) : null
            }
          >
            {isLoading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : reports && reports.revenueByRep.some((r) => r.revenue > 0) ? (
              <TopRepsChart data={reports.revenueByRep} />
            ) : (
              <EmptyState icon={BarChart3} title="No revenue yet" className="h-[260px]" />
            )}
          </ChartCard>

          <ChartCard title="Commission Payout Summary" description="Outstanding and paid commissions by rep">
            {isLoading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rep</TableHead>
                    <TableHead className="text-right">Pending</TableHead>
                    <TableHead className="text-right">Approved</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports?.payouts.map((p) => (
                    <TableRow key={p.rep.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar name={p.rep.name} color={p.rep.avatarColor} size="sm" />
                          <span className="text-sm font-medium">{p.rep.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-amber-600 dark:text-amber-400">
                        {formatCurrency(p.pending, { compact: true })}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sky-600 dark:text-sky-400">
                        {formatCurrency(p.approved, { compact: true })}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(p.paid, { compact: true })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ChartCard>
        </div>

        <div className="flex justify-end">
          {reports ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                exportToCsv(
                  "commission-payout-summary.csv",
                  reports.payouts.map((p) => ({
                    Rep: p.rep.name,
                    Pending: p.pending,
                    Approved: p.approved,
                    Paid: p.paid,
                    Total: p.total,
                  })),
                )
              }
            >
              <Download className="h-4 w-4" />
              Export payout summary
            </Button>
          ) : null}
        </div>
      </div>
    </>
  );
}
