# Sales Operations Dashboard

An internal business dashboard for a fictional home-sales company. It brings the
full revenue operation — CRM, sales pipeline, commissions, reporting, and an
audit trail — into a single, role-aware web app.

This is a portfolio project built to demonstrate **frontend / full-stack**
skills: Next.js App Router, TypeScript, a GraphQL API backed by Prisma,
type-safe forms, data visualisation, role-based access control, and a polished,
responsive UI.

> **Mock authentication:** there are no passwords. Pick one of four roles on the
> login screen and the app tailors navigation, permissions, and data to that
> role. You can switch roles at any time from the top-right menu.

---

## Tech stack

| Area              | Technology |
| ----------------- | ---------- |
| Framework         | [Next.js 16](https://nextjs.org/) (App Router) |
| Language          | [TypeScript](https://www.typescriptlang.org/) |
| Styling           | [Tailwind CSS v4](https://tailwindcss.com/) + shadcn/ui-style components |
| API               | [GraphQL](https://graphql.org/) via [Apollo Server](https://www.apollographql.com/docs/apollo-server/) (custom Next route adapter) |
| Data fetching     | [Apollo Client](https://www.apollographql.com/docs/react/) |
| ORM / DB          | [Prisma](https://www.prisma.io/) + SQLite (swappable for PostgreSQL) |
| Forms             | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) |
| Tables            | [TanStack Table](https://tanstack.com/table) |
| Charts            | [Recharts](https://recharts.org/) |
| Drag & drop       | [dnd-kit](https://dndkit.com/) |
| Icons             | [lucide-react](https://lucide.dev/) |

---

## Features

### 1. Authentication simulation
- Mock login with four roles: **Admin**, **Sales Manager**, **Sales Representative**, **Finance**.
- Selected role is stored in a cookie and resolved on the server.
- Each role sees different navigation, permissions, and (for reps) scoped data.

### 2. Dashboard
- KPI cards: total revenue, active leads, closed deals, pending commissions.
- Charts: monthly sales revenue, lead conversion funnel, top sales reps, leaderboard.
- Sales reps see metrics scoped to their own book of business.

### 3. CRM module
- Leads table with **search, status/rep filters, column sorting, and pagination**.
- Lead detail page with contact info, deal status, and notes.
- Create / edit lead form built with React Hook Form + Zod validation.

### 4. Sales pipeline
- Kanban board across six stages (New Lead → Closed Won / Closed Lost).
- Move leads by **drag-and-drop** _or_ a per-card "move to" menu.
- Moving a lead to **Closed Won** automatically records a sale and a pending commission.

### 5. Commission module
- Commission records with rate, amount, and status (Pending / Approved / Paid / Cancelled).
- **Finance / Admin** can approve, mark paid, or cancel (with confirmation dialogs).
- **Sales reps** can only view their own commissions.

### 6. Reports
- Monthly sales report, revenue by sales rep, and commission payout summary.
- **Functional CSV export** for each report section.

### 7. Audit log
- Chronological record of key actions: lead created/updated, sale closed,
  commission approved/paid/cancelled.
- Shows actor, role, action, entity, and timestamp.

### 8. Reusable component library
`DashboardCard`, `ChartCard`, `DataTable`, `StatusBadge`, `RoleGate`,
`ConfirmDialog`, `FormInput`, `EmptyState`, `ErrorState`, `Avatar`, plus a set of
shadcn/ui-style primitives (Button, Card, Dialog, Select, Table, Tabs, …).

---

## Role permission matrix

| Capability            | Admin | Sales Manager | Sales Rep | Finance |
| --------------------- | :---: | :-----------: | :-------: | :-----: |
| Dashboard             | ✅ | ✅ | ✅ (own) | ✅ |
| Leads (view/edit)     | ✅ | ✅ | ✅ (own) | — |
| Pipeline              | ✅ | ✅ | ✅ (own) | — |
| Commissions (view)    | ✅ all | ✅ all | ✅ own | ✅ all |
| Commissions (approve/pay) | ✅ | — | — | ✅ |
| Reports               | ✅ | ✅ | — | ✅ |
| Audit log             | ✅ | ✅ | — | ✅ |

Permissions are defined once in `src/lib/permissions.ts` and enforced both in the
UI (`RoleGate`, navigation) and in the GraphQL resolvers.

---

## Getting started

### Prerequisites
- Node.js 18.18+ (tested on Node 22)
- npm

### Install & run

```bash
# 1. Install dependencies
npm install

# 2. Create the SQLite database and generate the Prisma client
npm run db:push

# 3. Seed realistic demo data (users, leads, sales, commissions, audit log)
npm run db:seed

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and choose a role to sign in.

### Useful scripts

| Script             | Description |
| ------------------ | ----------- |
| `npm run dev`      | Start the Next.js dev server |
| `npm run build`    | Production build |
| `npm run db:push`  | Sync the Prisma schema to the database |
| `npm run db:seed`  | Seed demo data |
| `npm run db:reset` | Reset the database and re-seed |
| `npm run db:studio`| Open Prisma Studio |
| `npm run lint`     | Run ESLint |

### Switching to PostgreSQL
The app uses SQLite for zero-config local development. To use PostgreSQL,
change the `datasource` provider in `prisma/schema.prisma` to `postgresql`,
set `DATABASE_URL` in `.env` to your connection string, then run `npm run db:push`
and `npm run db:seed`.

---

## Project structure

```
prisma/
  schema.prisma          # Data models
  seed.ts                # Seed script
src/
  app/
    (auth)/login/        # Mock login screen
    (dashboard)/         # Authenticated app shell + pages
      dashboard/ leads/ pipeline/ commissions/ reports/ audit/
    api/graphql/route.ts # Apollo Server (custom Next adapter)
  components/
    ui/                  # shadcn/ui-style primitives
    dashboard/           # DashboardCard, ChartCard, charts
    data-table/          # DataTable, Pagination
    leads/ pipeline/     # Feature components
    shared/              # StatusBadge, RoleGate, ConfirmDialog, FormInput, ...
    layout/              # Sidebar, Topbar, RoleSwitcher, AppShell
    providers/           # Apollo + Session providers
  graphql/               # typeDefs, resolvers, context, client operations
  lib/                   # prisma, auth, permissions, commission math, utils
  types/                 # Shared TypeScript types
```

---

## How it works

- **GraphQL API** lives at `/api/graphql`. Because the official Apollo ↔ Next
  integration doesn't yet support Next 16, a small custom adapter
  (`src/app/api/graphql/route.ts`) bridges the Web `Request`/`Response` API to
  Apollo Server's HTTP interface.
- **Auth** is a cookie holding a user id. `getSessionUser()` resolves it on the
  server; the GraphQL context loads the same user so resolvers can enforce
  permissions and scope data per role.
- **Business rules** (e.g. closing a deal creates a sale + pending commission)
  live in the resolvers, and every important action writes to the audit log.

---

## Screenshots

> _Add screenshots here._ Suggested captures:
>
> - Login screen (role selection)
> - Dashboard (KPIs + charts)
> - Leads table with filters
> - Pipeline kanban board
> - Commissions (Finance view with actions)
> - Reports page
> - Audit log

```
docs/screenshots/
  login.png
  dashboard.png
  leads.png
  pipeline.png
  commissions.png
  reports.png
  audit.png
```

---

## What this project demonstrates

- **Full-stack architecture** with a typed GraphQL layer over Prisma.
- **Role-based access control** enforced consistently in the UI and the API.
- **Complex, interactive UI**: sortable/filterable/paginated tables, a
  drag-and-drop kanban board, dashboards, and data-driven charts.
- **Robust forms** with schema validation and good error states.
- **Real business workflows**: lead → pipeline → sale → commission → payout,
  with an audit trail.
- **Production-minded polish**: loading skeletons, empty states, error handling,
  a responsive layout, and a reusable component library.

---

_This is a fictional demo built for portfolio purposes. All data is generated by the seed script._
