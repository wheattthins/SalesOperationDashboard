"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { LeadStatus } from "@prisma/client";
import { formatCurrency } from "@/lib/utils";
import { LEAD_STATUS_LABELS } from "@/lib/constants";

const AXIS = "var(--color-muted-foreground)";
const GRID = "var(--color-border)";

function TooltipBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      {children}
    </div>
  );
}

export function MonthlyRevenueChart({
  data,
}: {
  data: { month: string; revenue: number; deals: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="month" stroke={AXIS} fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke={AXIS}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={(v: number) => formatCurrency(v, { compact: true })}
        />
        <Tooltip
          cursor={{ stroke: GRID }}
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <TooltipBox>
                <p className="font-medium">{label}</p>
                <p className="text-muted-foreground">
                  {formatCurrency(payload[0].payload.revenue)} · {payload[0].payload.deals} deals
                </p>
              </TooltipBox>
            ) : null
          }
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="var(--color-chart-1)"
          strokeWidth={2}
          fill="url(#revFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

const FUNNEL_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-4)",
  "var(--color-chart-3)",
  "var(--color-chart-5)",
  "var(--color-destructive)",
];

export function ConversionChart({
  data,
}: {
  data: { status: LeadStatus; count: number }[];
}) {
  const chartData = data.map((d) => ({ ...d, label: LEAD_STATUS_LABELS[d.status] }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
        <XAxis type="number" stroke={AXIS} fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="label"
          stroke={AXIS}
          fontSize={11}
          tickLine={false}
          axisLine={false}
          width={104}
        />
        <Tooltip
          cursor={{ fill: "var(--color-muted)", opacity: 0.4 }}
          content={({ active, payload }) =>
            active && payload?.length ? (
              <TooltipBox>
                <p className="font-medium">{payload[0].payload.label}</p>
                <p className="text-muted-foreground">{payload[0].payload.count} leads</p>
              </TooltipBox>
            ) : null
          }
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={18}>
          {chartData.map((_, i) => (
            <Cell key={i} fill={FUNNEL_COLORS[i % FUNNEL_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TopRepsChart({
  data,
}: {
  data: { rep: { name: string; avatarColor: string }; revenue: number; deals: number }[];
}) {
  const chartData = data.map((d) => ({
    name: d.rep.name.split(" ")[0],
    fullName: d.rep.name,
    revenue: d.revenue,
    deals: d.deals,
    color: d.rep.avatarColor,
  }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="name" stroke={AXIS} fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke={AXIS}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={(v: number) => formatCurrency(v, { compact: true })}
        />
        <Tooltip
          cursor={{ fill: "var(--color-muted)", opacity: 0.4 }}
          content={({ active, payload }) =>
            active && payload?.length ? (
              <TooltipBox>
                <p className="font-medium">{payload[0].payload.fullName}</p>
                <p className="text-muted-foreground">
                  {formatCurrency(payload[0].payload.revenue)} · {payload[0].payload.deals} deals
                </p>
              </TooltipBox>
            ) : null
          }
        />
        <Bar dataKey="revenue" radius={[4, 4, 0, 0]} barSize={36}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
