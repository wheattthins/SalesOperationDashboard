import { GraphQLError } from "graphql";
import type { Prisma, LeadStatus } from "@prisma/client";
import type { GraphQLContext } from "./context";
import { can, type Permission } from "@/lib/permissions";
import { calculateCommission } from "@/lib/commission";

function requireUser(ctx: GraphQLContext) {
  if (!ctx.user) {
    throw new GraphQLError("Not authenticated", { extensions: { code: "UNAUTHENTICATED" } });
  }
  return ctx.user;
}

function requirePermission(ctx: GraphQLContext, permission: Permission) {
  const user = requireUser(ctx);
  if (!can(user.role, permission)) {
    throw new GraphQLError("You do not have permission to perform this action", {
      extensions: { code: "FORBIDDEN" },
    });
  }
  return user;
}

async function writeAudit(
  ctx: GraphQLContext,
  entry: { action: string; entityType: string; entityId: string; summary: string },
) {
  if (!ctx.user) return;
  await ctx.prisma.auditLog.create({
    data: { ...entry, actorName: ctx.user.name, actorRole: ctx.user.role },
  });
}

const ALL_STATUSES: LeadStatus[] = [
  "NEW_LEAD",
  "CONTACTED",
  "SHOWING_SCHEDULED",
  "OFFER_MADE",
  "CLOSED_WON",
  "CLOSED_LOST",
];

/** Reps only see their own data; everyone else sees the whole team. */
function leadScope(ctx: GraphQLContext): Prisma.LeadWhereInput {
  return ctx.user?.role === "SALES_REP" ? { assignedRepId: ctx.user.id } : {};
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function lastMonths(count: number): { key: string; label: string }[] {
  const out: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      key: monthKey(d),
      label: d.toLocaleString("en-US", { month: "short", year: "2-digit" }),
    });
  }
  return out;
}

async function buildMonthlyRevenue(ctx: GraphQLContext) {
  const where: Prisma.SaleWhereInput =
    ctx.user?.role === "SALES_REP" ? { repId: ctx.user.id } : {};
  const sales = await ctx.prisma.sale.findMany({ where });
  const months = lastMonths(6);
  const byMonth = new Map(months.map((m) => [m.key, { revenue: 0, deals: 0 }]));
  for (const sale of sales) {
    const key = monthKey(sale.closedAt);
    const bucket = byMonth.get(key);
    if (bucket) {
      bucket.revenue += sale.salePrice;
      bucket.deals += 1;
    }
  }
  return months.map((m) => ({
    month: m.label,
    revenue: byMonth.get(m.key)!.revenue,
    deals: byMonth.get(m.key)!.deals,
  }));
}

async function buildRepPerformance(ctx: GraphQLContext) {
  const reps = await ctx.prisma.user.findMany({ where: { role: "SALES_REP" } });
  const result = [];
  for (const rep of reps) {
    const sales = await ctx.prisma.sale.findMany({
      where: { repId: rep.id },
      include: { commission: true },
    });
    const revenue = sales.reduce((s, x) => s + x.salePrice, 0);
    const commission = sales.reduce((s, x) => s + (x.commission?.amount ?? 0), 0);
    result.push({ rep, revenue, deals: sales.length, commission });
  }
  return result.sort((a, b) => b.revenue - a.revenue);
}

export const resolvers = {
  Query: {
    me: (_p: unknown, _a: unknown, ctx: GraphQLContext) => ctx.user,

    users: (_p: unknown, args: { role?: string }, ctx: GraphQLContext) => {
      requireUser(ctx);
      return ctx.prisma.user.findMany({
        where: args.role ? { role: args.role as never } : {},
        orderBy: { name: "asc" },
      });
    },

    reps: (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      requireUser(ctx);
      return ctx.prisma.user.findMany({ where: { role: "SALES_REP" }, orderBy: { name: "asc" } });
    },

    leads: async (
      _p: unknown,
      args: { search?: string; status?: LeadStatus; repId?: string; page?: number; pageSize?: number },
      ctx: GraphQLContext,
    ) => {
      requirePermission(ctx, "view:leads");
      const page = Math.max(1, args.page ?? 1);
      const pageSize = Math.min(100, Math.max(1, args.pageSize ?? 10));

      const where: Prisma.LeadWhereInput = { ...leadScope(ctx) };
      if (args.status) where.status = args.status;
      if (args.repId && ctx.user?.role !== "SALES_REP") where.assignedRepId = args.repId;
      if (args.search) {
        where.OR = [
          { name: { contains: args.search } },
          { email: { contains: args.search } },
          { phone: { contains: args.search } },
        ];
      }

      const [items, total] = await Promise.all([
        ctx.prisma.lead.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        ctx.prisma.lead.count({ where }),
      ]);

      return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
    },

    lead: async (_p: unknown, args: { id: string }, ctx: GraphQLContext) => {
      requirePermission(ctx, "view:leads");
      const lead = await ctx.prisma.lead.findUnique({ where: { id: args.id } });
      if (!lead) return null;
      if (ctx.user?.role === "SALES_REP" && lead.assignedRepId !== ctx.user.id) {
        throw new GraphQLError("Not allowed to view this lead", { extensions: { code: "FORBIDDEN" } });
      }
      return lead;
    },

    pipeline: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      requirePermission(ctx, "view:pipeline");
      const leads = await ctx.prisma.lead.findMany({
        where: leadScope(ctx),
        orderBy: { updatedAt: "desc" },
      });
      return ALL_STATUSES.map((status) => {
        const columnLeads = leads.filter((l) => l.status === status);
        return {
          status,
          leads: columnLeads,
          count: columnLeads.length,
          value: columnLeads.reduce((s, l) => s + l.budget, 0),
        };
      });
    },

    commissions: async (
      _p: unknown,
      args: { status?: string; repId?: string },
      ctx: GraphQLContext,
    ) => {
      requirePermission(ctx, "view:commissions");
      const where: Prisma.CommissionWhereInput = {};
      if (ctx.user?.role === "SALES_REP") {
        where.repId = ctx.user.id;
      } else if (args.repId) {
        where.repId = args.repId;
      }
      if (args.status) where.status = args.status as never;
      return ctx.prisma.commission.findMany({ where, orderBy: { createdAt: "desc" } });
    },

    dashboardStats: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      requirePermission(ctx, "view:dashboard");
      const leadWhere = leadScope(ctx);
      const saleWhere: Prisma.SaleWhereInput =
        ctx.user?.role === "SALES_REP" ? { repId: ctx.user.id } : {};
      const commissionWhere: Prisma.CommissionWhereInput =
        ctx.user?.role === "SALES_REP" ? { repId: ctx.user.id } : {};

      const [sales, activeLeads, closedDeals, pendingCommissions, leadCounts] = await Promise.all([
        ctx.prisma.sale.findMany({ where: saleWhere }),
        ctx.prisma.lead.count({
          where: { ...leadWhere, status: { notIn: ["CLOSED_WON", "CLOSED_LOST"] } },
        }),
        ctx.prisma.sale.count({ where: saleWhere }),
        ctx.prisma.commission.aggregate({
          where: { ...commissionWhere, status: { in: ["PENDING", "APPROVED"] } },
          _sum: { amount: true },
        }),
        ctx.prisma.lead.groupBy({ by: ["status"], where: leadWhere, _count: { _all: true } }),
      ]);

      const totalRevenue = sales.reduce((s, x) => s + x.salePrice, 0);
      const countByStatus = new Map(leadCounts.map((c) => [c.status, c._count._all]));

      return {
        kpis: {
          totalRevenue,
          activeLeads,
          closedDeals,
          pendingCommissions: pendingCommissions._sum.amount ?? 0,
        },
        monthlyRevenue: await buildMonthlyRevenue(ctx),
        conversion: ALL_STATUSES.map((status) => ({
          status,
          count: countByStatus.get(status) ?? 0,
        })),
        topReps: (await buildRepPerformance(ctx)).slice(0, 5),
      };
    },

    reports: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      requirePermission(ctx, "view:reports");
      const reps = await ctx.prisma.user.findMany({ where: { role: "SALES_REP" } });
      const payouts = [];
      for (const rep of reps) {
        const commissions = await ctx.prisma.commission.findMany({ where: { repId: rep.id } });
        const sum = (status: string) =>
          commissions.filter((c) => c.status === status).reduce((s, c) => s + c.amount, 0);
        const pending = sum("PENDING");
        const approved = sum("APPROVED");
        const paid = sum("PAID");
        payouts.push({ rep, pending, approved, paid, total: pending + approved + paid });
      }
      return {
        monthlyRevenue: await buildMonthlyRevenue(ctx),
        revenueByRep: await buildRepPerformance(ctx),
        payouts: payouts.sort((a, b) => b.total - a.total),
      };
    },

    auditLogs: (_p: unknown, args: { limit?: number }, ctx: GraphQLContext) => {
      requirePermission(ctx, "view:audit");
      return ctx.prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: Math.min(200, args.limit ?? 50),
      });
    },
  },

  Mutation: {
    createLead: async (_p: unknown, args: { input: LeadInputArg }, ctx: GraphQLContext) => {
      requirePermission(ctx, "edit:leads");
      const lead = await ctx.prisma.lead.create({ data: normalizeLeadInput(args.input) });
      await writeAudit(ctx, {
        action: "LEAD_CREATED",
        entityType: "Lead",
        entityId: lead.id,
        summary: `Lead "${lead.name}" created`,
      });
      return lead;
    },

    updateLead: async (_p: unknown, args: { id: string; input: LeadInputArg }, ctx: GraphQLContext) => {
      requirePermission(ctx, "edit:leads");
      const existing = await ctx.prisma.lead.findUnique({ where: { id: args.id } });
      if (!existing) throw new GraphQLError("Lead not found", { extensions: { code: "NOT_FOUND" } });
      const lead = await ctx.prisma.lead.update({
        where: { id: args.id },
        data: normalizeLeadInput(args.input),
      });
      await maybeCloseSale(ctx, existing.status, lead);
      await writeAudit(ctx, {
        action: "LEAD_UPDATED",
        entityType: "Lead",
        entityId: lead.id,
        summary: `Lead "${lead.name}" updated`,
      });
      return lead;
    },

    updateLeadStatus: async (
      _p: unknown,
      args: { id: string; status: LeadStatus },
      ctx: GraphQLContext,
    ) => {
      requirePermission(ctx, "edit:pipeline");
      const existing = await ctx.prisma.lead.findUnique({ where: { id: args.id } });
      if (!existing) throw new GraphQLError("Lead not found", { extensions: { code: "NOT_FOUND" } });
      if (ctx.user?.role === "SALES_REP" && existing.assignedRepId !== ctx.user.id) {
        throw new GraphQLError("Not allowed to modify this lead", { extensions: { code: "FORBIDDEN" } });
      }
      const lead = await ctx.prisma.lead.update({
        where: { id: args.id },
        data: { status: args.status },
      });
      await maybeCloseSale(ctx, existing.status, lead);
      await writeAudit(ctx, {
        action: "LEAD_UPDATED",
        entityType: "Lead",
        entityId: lead.id,
        summary: `Lead "${lead.name}" moved to ${args.status.replace(/_/g, " ").toLowerCase()}`,
      });
      return lead;
    },

    approveCommission: async (_p: unknown, args: { id: string }, ctx: GraphQLContext) => {
      const user = requirePermission(ctx, "manage:commissions");
      const commission = await ctx.prisma.commission.update({
        where: { id: args.id },
        data: { status: "APPROVED", approvedById: user.id },
        include: { rep: true },
      });
      await writeAudit(ctx, {
        action: "COMMISSION_APPROVED",
        entityType: "Commission",
        entityId: commission.id,
        summary: `Approved $${commission.amount.toLocaleString()} commission for ${commission.rep.name}`,
      });
      return commission;
    },

    payCommission: async (_p: unknown, args: { id: string }, ctx: GraphQLContext) => {
      requirePermission(ctx, "manage:commissions");
      const commission = await ctx.prisma.commission.update({
        where: { id: args.id },
        data: { status: "PAID", paidAt: new Date() },
        include: { rep: true },
      });
      await writeAudit(ctx, {
        action: "COMMISSION_PAID",
        entityType: "Commission",
        entityId: commission.id,
        summary: `Paid $${commission.amount.toLocaleString()} commission to ${commission.rep.name}`,
      });
      return commission;
    },

    cancelCommission: async (_p: unknown, args: { id: string }, ctx: GraphQLContext) => {
      requirePermission(ctx, "manage:commissions");
      const commission = await ctx.prisma.commission.update({
        where: { id: args.id },
        data: { status: "CANCELLED" },
        include: { rep: true },
      });
      await writeAudit(ctx, {
        action: "COMMISSION_CANCELLED",
        entityType: "Commission",
        entityId: commission.id,
        summary: `Cancelled commission for ${commission.rep.name}`,
      });
      return commission;
    },
  },

  Lead: {
    assignedRep: (parent: { assignedRepId: string }, _a: unknown, ctx: GraphQLContext) =>
      ctx.prisma.user.findUnique({ where: { id: parent.assignedRepId } }),
    sale: (parent: { id: string }, _a: unknown, ctx: GraphQLContext) =>
      ctx.prisma.sale.findUnique({ where: { leadId: parent.id } }),
    createdAt: (parent: { createdAt: Date }) => parent.createdAt.toISOString(),
    updatedAt: (parent: { updatedAt: Date }) => parent.updatedAt.toISOString(),
  },

  Sale: {
    rep: (parent: { repId: string }, _a: unknown, ctx: GraphQLContext) =>
      ctx.prisma.user.findUnique({ where: { id: parent.repId } }),
    lead: (parent: { leadId: string }, _a: unknown, ctx: GraphQLContext) =>
      ctx.prisma.lead.findUnique({ where: { id: parent.leadId } }),
    commission: (parent: { id: string }, _a: unknown, ctx: GraphQLContext) =>
      ctx.prisma.commission.findUnique({ where: { saleId: parent.id } }),
    closedAt: (parent: { closedAt: Date }) => parent.closedAt.toISOString(),
  },

  Commission: {
    rep: (parent: { repId: string }, _a: unknown, ctx: GraphQLContext) =>
      ctx.prisma.user.findUnique({ where: { id: parent.repId } }),
    sale: (parent: { saleId: string }, _a: unknown, ctx: GraphQLContext) =>
      ctx.prisma.sale.findUnique({ where: { id: parent.saleId } }),
    approvedBy: (parent: { approvedById: string | null }, _a: unknown, ctx: GraphQLContext) =>
      parent.approvedById
        ? ctx.prisma.user.findUnique({ where: { id: parent.approvedById } })
        : null,
    createdAt: (parent: { createdAt: Date }) => parent.createdAt.toISOString(),
    paidAt: (parent: { paidAt: Date | null }) => (parent.paidAt ? parent.paidAt.toISOString() : null),
  },

  AuditLog: {
    createdAt: (parent: { createdAt: Date }) => parent.createdAt.toISOString(),
  },
};

interface LeadInputArg {
  name: string;
  email: string;
  phone: string;
  source: string;
  status: LeadStatus;
  budget: number;
  assignedRepId: string;
  notes?: string | null;
}

function normalizeLeadInput(input: LeadInputArg) {
  return {
    name: input.name,
    email: input.email,
    phone: input.phone,
    source: input.source as never,
    status: input.status,
    budget: input.budget,
    assignedRepId: input.assignedRepId,
    notes: input.notes ?? null,
  };
}

/**
 * When a lead transitions into CLOSED_WON and has no Sale yet, create the Sale
 * and a PENDING Commission so the finance workflow has something to act on.
 */
async function maybeCloseSale(
  ctx: GraphQLContext,
  previousStatus: LeadStatus,
  lead: { id: string; name: string; budget: number; assignedRepId: string; status: LeadStatus },
) {
  if (lead.status !== "CLOSED_WON" || previousStatus === "CLOSED_WON") return;
  const existingSale = await ctx.prisma.sale.findUnique({ where: { leadId: lead.id } });
  if (existingSale) return;

  const rep = await ctx.prisma.user.findUnique({ where: { id: lead.assignedRepId } });
  const rate = rep?.commissionRate ?? 0.03;
  const sale = await ctx.prisma.sale.create({
    data: { salePrice: lead.budget, leadId: lead.id, repId: lead.assignedRepId },
  });
  await ctx.prisma.commission.create({
    data: {
      saleId: sale.id,
      repId: lead.assignedRepId,
      rate,
      amount: calculateCommission(lead.budget, rate),
      status: "PENDING",
    },
  });
  await writeAudit(ctx, {
    action: "SALE_CLOSED",
    entityType: "Sale",
    entityId: sale.id,
    summary: `Closed deal for "${lead.name}" at $${lead.budget.toLocaleString()}`,
  });
}
