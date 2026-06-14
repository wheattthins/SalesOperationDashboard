"use client";

import { useQuery } from "@apollo/client";
import { DollarSign, Users, Trophy, Wallet, TrendingUp } from "lucide-react";
import { DASHBOARD_STATS_QUERY } from "@/graphql/operations";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { MonthlyRevenueChart, ConversionChart, TopRepsChart } from "@/components/dashboard/charts";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { Avatar } from "@/components/shared/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/components/providers/session-provider";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import type { LeadStatus } from "@prisma/client";

interface DashboardData {
  dashboardStats: {
    kpis: {
      totalRevenue: number;
      activeLeads: number;
      closedDeals: number;
      pendingCommissions: number;
    };
    monthlyRevenue: { month: string; revenue: number; deals: number }[];
    conversion: { status: LeadStatus; count: number }[];
    topReps: {
      rep: { id: string; name: string; avatarColor: string };
      revenue: number;
      deals: number;
      commission: number;
    }[];
  };
}

export default function DashboardPage() {
  const { user } = useSession();
  const { data, loading, error, refetch } = useQuery<DashboardData>(DASHBOARD_STATS_QUERY, {
    fetchPolicy: "cache-and-network",
  });

  const stats = data?.dashboardStats;
  const totalLeads = stats?.conversion.reduce((s, c) => s + c.count, 0) ?? 0;
  const won = stats?.conversion.find((c) => c.status === "CLOSED_WON")?.count ?? 0;
  const winRate = totalLeads ? won / totalLeads : 0;

  if (error && !stats) {
    return (
      <>
        <PageHeader title="Dashboard" description={`Welcome back, ${user.name.split(" ")[0]}.`} />
        <ErrorState message={error.message} onRetry={() => void refetch()} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        description={
          user.role === "SALES_REP"
            ? "Here's how your book of business is performing."
            : "Here's how the sales operation is performing."
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Total Revenue"
          value={formatCurrency(stats?.kpis.totalRevenue ?? 0)}
          icon={DollarSign}
          accent="emerald"
          loading={loading && !stats}
          hint="from closed deals"
        />
        <DashboardCard
          title="Active Leads"
          value={formatNumber(stats?.kpis.activeLeads ?? 0)}
          icon={Users}
          accent="sky"
          loading={loading && !stats}
          hint="in the pipeline"
        />
        <DashboardCard
          title="Closed Deals"
          value={formatNumber(stats?.kpis.closedDeals ?? 0)}
          icon={Trophy}
          accent="primary"
          loading={loading && !stats}
          trend={{ value: formatPercent(winRate), positive: winRate >= 0.2 }}
          hint="win rate"
        />
        <DashboardCard
          title="Pending Commissions"
          value={formatCurrency(stats?.kpis.pendingCommissions ?? 0)}
          icon={Wallet}
          accent="amber"
          loading={loading && !stats}
          hint="awaiting payout"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <ChartCard
          title="Monthly Sales Revenue"
          description="Closed-deal revenue over the last 6 months"
          className="lg:col-span-2"
        >
          {loading && !stats ? (
            <Skeleton className="h-[260px] w-full" />
          ) : stats && stats.monthlyRevenue.some((m) => m.revenue > 0) ? (
            <MonthlyRevenueChart data={stats.monthlyRevenue} />
          ) : (
            <EmptyState icon={TrendingUp} title="No revenue yet" description="Close a deal to see revenue here." className="h-[260px]" />
          )}
        </ChartCard>

        <ChartCard title="Lead Conversion" description="Leads by pipeline stage">
          {loading && !stats ? (
            <Skeleton className="h-[260px] w-full" />
          ) : (
            <ConversionChart data={stats?.conversion ?? []} />
          )}
        </ChartCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <ChartCard
          title="Top Sales Reps"
          description="Revenue by representative"
          className="lg:col-span-2"
        >
          {loading && !stats ? (
            <Skeleton className="h-[260px] w-full" />
          ) : stats && stats.topReps.some((r) => r.revenue > 0) ? (
            <TopRepsChart data={stats.topReps} />
          ) : (
            <EmptyState icon={Trophy} title="No sales yet" className="h-[260px]" />
          )}
        </ChartCard>

        <ChartCard title="Leaderboard" description="Ranked by revenue">
          <div className="space-y-1">
            {loading && !stats
              ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
              : stats?.topReps.map((r, i) => (
                  <div key={r.rep.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/50">
                    <span className="w-4 text-sm font-semibold text-muted-foreground">{i + 1}</span>
                    <Avatar name={r.rep.name} color={r.rep.avatarColor} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{r.rep.name}</p>
                      <p className="text-xs text-muted-foreground">{r.deals} deals</p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">
                      {formatCurrency(r.revenue, { compact: true })}
                    </span>
                  </div>
                ))}
          </div>
        </ChartCard>
      </div>
    </>
  );
}
