import { PrismaClient, type Role, type LeadStatus, type LeadSource, type CommissionStatus } from "@prisma/client";

const prisma = new PrismaClient();

function calculateCommission(salePrice: number, rate: number): number {
  return Math.round(salePrice * rate * 100) / 100;
}

// Small seeded RNG so the dataset is stable across runs.
let seed = 42;
function rand(): number {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
}
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}
function randInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}
function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(randInt(8, 18), randInt(0, 59), 0, 0);
  return d;
}

const FIRST_NAMES = [
  "Olivia", "Liam", "Emma", "Noah", "Ava", "Ethan", "Sophia", "Mason", "Isabella", "Lucas",
  "Mia", "Logan", "Charlotte", "Jackson", "Amelia", "Aiden", "Harper", "Elijah", "Evelyn", "James",
  "Abigail", "Benjamin", "Emily", "Carter", "Ella", "Henry", "Grace", "Sebastian", "Chloe", "Jack",
];
const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
  "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
];

const SOURCES: LeadSource[] = ["WEBSITE", "REFERRAL", "ZILLOW", "WALK_IN", "SOCIAL_MEDIA", "COLD_CALL"];
// Weighted distribution to look like a realistic pipeline funnel.
const STATUS_WEIGHTS: [LeadStatus, number][] = [
  ["NEW_LEAD", 18],
  ["CONTACTED", 14],
  ["SHOWING_SCHEDULED", 10],
  ["OFFER_MADE", 8],
  ["CLOSED_WON", 22],
  ["CLOSED_LOST", 12],
];

function weightedStatus(): LeadStatus {
  const total = STATUS_WEIGHTS.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [status, w] of STATUS_WEIGHTS) {
    if (r < w) return status;
    r -= w;
  }
  return "NEW_LEAD";
}

async function main() {
  console.log("Clearing existing data...");
  await prisma.auditLog.deleteMany();
  await prisma.commission.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.user.deleteMany();

  console.log("Seeding users...");
  const usersData: { name: string; email: string; role: Role; commissionRate: number; avatarColor: string }[] = [
    { name: "Dana Whitfield", email: "admin@homesales.dev", role: "ADMIN", commissionRate: 0, avatarColor: "#6366f1" },
    { name: "Marcus Bell", email: "manager@homesales.dev", role: "SALES_MANAGER", commissionRate: 0.01, avatarColor: "#0ea5e9" },
    { name: "Priya Nair", email: "finance@homesales.dev", role: "FINANCE", commissionRate: 0, avatarColor: "#10b981" },
    { name: "Alex Carter", email: "alex@homesales.dev", role: "SALES_REP", commissionRate: 0.03, avatarColor: "#f59e0b" },
    { name: "Jordan Lee", email: "jordan@homesales.dev", role: "SALES_REP", commissionRate: 0.025, avatarColor: "#ef4444" },
    { name: "Sam Rivera", email: "sam@homesales.dev", role: "SALES_REP", commissionRate: 0.035, avatarColor: "#8b5cf6" },
    { name: "Taylor Quinn", email: "taylor@homesales.dev", role: "SALES_REP", commissionRate: 0.028, avatarColor: "#ec4899" },
    { name: "Morgan Hayes", email: "morgan@homesales.dev", role: "SALES_REP", commissionRate: 0.032, avatarColor: "#14b8a6" },
  ];

  const users = [];
  for (const u of usersData) {
    users.push(await prisma.user.create({ data: u }));
  }
  const reps = users.filter((u) => u.role === "SALES_REP");
  const finance = users.find((u) => u.role === "FINANCE")!;

  console.log("Seeding leads, sales, commissions...");
  const LEAD_COUNT = 64;
  const commissionStatusForClosed = (): CommissionStatus => {
    const r = rand();
    if (r < 0.35) return "PAID";
    if (r < 0.65) return "APPROVED";
    if (r < 0.92) return "PENDING";
    return "CANCELLED";
  };

  for (let i = 0; i < LEAD_COUNT; i++) {
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    const name = `${first} ${last}`;
    const rep = pick(reps);
    const status = weightedStatus();
    const createdDaysAgo = randInt(2, 210);
    const budget = randInt(180, 950) * 1000;

    const lead = await prisma.lead.create({
      data: {
        name,
        email: `${first.toLowerCase()}.${last.toLowerCase()}${randInt(1, 99)}@example.com`,
        phone: `(${randInt(200, 989)}) ${randInt(200, 989)}-${String(randInt(0, 9999)).padStart(4, "0")}`,
        source: pick(SOURCES),
        status,
        budget,
        assignedRepId: rep.id,
        notes: rand() > 0.6 ? pick([
          "Pre-approved with local lender.",
          "Looking to close within 60 days.",
          "Relocating for work, flexible on neighborhood.",
          "First-time homebuyer, needs guidance.",
          "Interested in new construction only.",
        ]) : null,
        createdAt: daysAgo(createdDaysAgo),
      },
    });

    if (status === "CLOSED_WON") {
      // Closed for slightly under or over budget.
      const salePrice = Math.round(budget * (0.92 + rand() * 0.16));
      const closedDaysAgo = Math.max(1, createdDaysAgo - randInt(10, 45));
      const sale = await prisma.sale.create({
        data: {
          salePrice,
          leadId: lead.id,
          repId: rep.id,
          closedAt: daysAgo(closedDaysAgo),
        },
      });

      const cStatus = commissionStatusForClosed();
      const amount = calculateCommission(salePrice, rep.commissionRate);
      await prisma.commission.create({
        data: {
          saleId: sale.id,
          repId: rep.id,
          rate: rep.commissionRate,
          amount,
          status: cStatus,
          approvedById: cStatus === "APPROVED" || cStatus === "PAID" ? finance.id : null,
          paidAt: cStatus === "PAID" ? daysAgo(Math.max(0, closedDaysAgo - randInt(2, 8))) : null,
        },
      });
    }
  }

  console.log("Seeding audit log...");
  const leads = await prisma.lead.findMany({ include: { assignedRep: true, sale: { include: { commission: true } } } });
  const auditEntries: { action: string; entityType: string; entityId: string; summary: string; actorName: string; actorRole: Role; createdAt: Date }[] = [];

  for (const lead of leads.slice(0, 30)) {
    auditEntries.push({
      action: "LEAD_CREATED",
      entityType: "Lead",
      entityId: lead.id,
      summary: `Lead "${lead.name}" created from ${lead.source.toLowerCase().replace("_", " ")}`,
      actorName: lead.assignedRep.name,
      actorRole: "SALES_REP",
      createdAt: lead.createdAt,
    });
    if (lead.sale) {
      auditEntries.push({
        action: "SALE_CLOSED",
        entityType: "Sale",
        entityId: lead.sale.id,
        summary: `Closed deal for "${lead.name}" at $${lead.sale.salePrice.toLocaleString()}`,
        actorName: lead.assignedRep.name,
        actorRole: "SALES_REP",
        createdAt: lead.sale.closedAt,
      });
      if (lead.sale.commission && (lead.sale.commission.status === "APPROVED" || lead.sale.commission.status === "PAID")) {
        auditEntries.push({
          action: "COMMISSION_APPROVED",
          entityType: "Commission",
          entityId: lead.sale.commission.id,
          summary: `Approved $${lead.sale.commission.amount.toLocaleString()} commission for ${lead.assignedRep.name}`,
          actorName: finance.name,
          actorRole: "FINANCE",
          createdAt: lead.sale.closedAt,
        });
      }
      if (lead.sale.commission && lead.sale.commission.status === "PAID" && lead.sale.commission.paidAt) {
        auditEntries.push({
          action: "COMMISSION_PAID",
          entityType: "Commission",
          entityId: lead.sale.commission.id,
          summary: `Paid $${lead.sale.commission.amount.toLocaleString()} commission to ${lead.assignedRep.name}`,
          actorName: finance.name,
          actorRole: "FINANCE",
          createdAt: lead.sale.commission.paidAt,
        });
      }
    }
  }

  for (const entry of auditEntries) {
    await prisma.auditLog.create({ data: entry });
  }

  const counts = {
    users: await prisma.user.count(),
    leads: await prisma.lead.count(),
    sales: await prisma.sale.count(),
    commissions: await prisma.commission.count(),
    auditLogs: await prisma.auditLog.count(),
  };
  console.log("Seed complete:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
