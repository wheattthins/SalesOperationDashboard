# Power BI assembly guide

This folder (plus `analytics/sql/` and `scripts/etl/`) builds a real
dimensional model on top of the app's OLTP data so it can be reported on in
Power BI. A `.pbix` is a binary file Power BI Desktop owns — it can't be hand
-written — so this guide is the mechanical steps to assemble it from the
artifacts already in this repo.

## 0. Prerequisites
- Power BI Desktop (Windows)
- The Neon Postgres connection string for this project (`.env` → `DATABASE_URL_UNPOOLED`; run `npx neonctl env pull` if you don't have it locally)
- Node deps installed (`npm install`) in this repo

## 1. Generate and load the data

```bash
npm run db:seed   # refreshes ~2 years of leads/sales/commissions in the OLTP tables
npm run db:etl     # builds/rebuilds the analytics.* star schema from the OLTP tables
```

`db:etl` runs `analytics/sql/01_schema.sql` → `05_views.sql` in order against
`DATABASE_URL`/`DATABASE_URL_UNPOOLED`. Safe to rerun any time — it's a full
rebuild of the `analytics` schema and never touches the app's `public` tables.

## 2. Connect Power BI Desktop to the star schema
1. **Get Data → PostgreSQL database**.
2. Server: your Neon host (from the connection string, e.g. `ep-xxxx.us-east-2.aws.neon.tech`). Database: `neondb`.
3. In the Navigator, expand the **`analytics`** schema (not `public`) and select:
   - `dim_date`, `dim_rep`, `dim_lead_source`, `dim_lead_status`
   - `fact_leads`, `fact_sales`, `fact_commission`
4. Choose **Transform Data** (not Load) so you can apply the Power Query steps next.

## 3. Apply the Power Query layer
Open **Manage Parameters** and create `RangeStart`, `RangeEnd`, `PBIEnvironment` as described in `powerbi/power-query.m` (§1). Then, per table, open **Advanced Editor** and apply the matching block from that file:
- `fact_sales` → §3 (range filter + Deal Tier conditional column)
- `dim_lead_source` → §4 (channel-group merge)
- `dim_rep` → §5 (current-version filter), and rename the query to `DimRepCurrent` or just filter in place
- Rename queries to `DimDate`, `DimRep`, `DimLeadSource`, `DimLeadStatus`, `FactLeads`, `FactSales`, `FactCommission` for clean DAX references.

## 4. Build the model (star schema relationships)
In **Model view**, create these relationships (all single-direction, 1-to-many from dim → fact):

| From | To |
|---|---|
| `DimDate[date_key]` | `FactLeads[created_date_key]` |
| `DimDate[date_key]` | `FactSales[closed_date_key]` |
| `DimDate[date_key]` | `FactCommission[created_date_key]` |
| `DimDate[date_key]` | `FactCommission[paid_date_key]` *(inactive — activate with `USERELATIONSHIP` if you add a "paid date" view)* |
| `DimRep[rep_sk]` | `FactLeads[rep_sk]` |
| `DimRep[rep_sk]` | `FactSales[rep_sk]` |
| `DimRep[rep_sk]` | `FactCommission[rep_sk]` |
| `DimLeadSource[source_key]` | `FactLeads[source_key]` |
| `DimLeadStatus[status_key]` | `FactLeads[status_key]` |

Then: right-click `DimDate` → **Mark as date table**, using `full_date`.

## 5. Add the DAX measures
Create a blank measures table (**New Table**: `Measures = ROW("_", 0)`, hide the `_` column) and paste every measure from `powerbi/measures.dax` into it via **New Measure**.

## 6. Row-level security
**Modeling → Manage Roles** → new role `Sales Rep`, table filter on `DimRep`:
```
DimRep[email] = USERPRINCIPALNAME() && DimRep[is_current] = TRUE
```
Leave `Admin` / `Sales Manager` / `Finance` roles with no filter — mirrors the app's `src/lib/permissions.ts` matrix. Test with **View As Roles**.

## 7. Suggested report pages
- **Overview** — KPI cards (Total Revenue, Revenue YoY %, Deals Closed, Commission Outstanding), revenue trend line with Rolling 12M
- **Pipeline** — funnel by `DimLeadStatus[pipeline_stage_order]`, conversion % by `DimLeadSource[channel_group]`
- **Rep Leaderboard** — table with Rep Revenue Rank, Revenue Share %, Avg Days to Close
- **Commissions** — accrued vs. paid vs. outstanding, by status and by rep

## 8. Refreshing
Rerun `npm run db:etl` after reseeding or after changing a rep's `commissionRate` in the app (the latter is what produces a second row in `dim_rep`, demonstrating the SCD2 versioning — see `analytics/sql/03_load_dims.sql`), then **Refresh** in Power BI Desktop. Since Neon is internet-reachable, scheduled refresh in the Power BI Service works without an on-premises gateway — just add the Postgres credentials in the semantic model's data source settings.

## What to put on the resume
- Dimensional modeling: star schema with conformed dimensions and a Type 2 SCD (`dim_rep`)
- ETL: SQL-driven extract/transform/load job (`scripts/etl/run-etl.ts`) rebuilding the warehouse from OLTP tables
- Advanced SQL: `generate_series` date spine, point-in-time SCD2 joins, CTEs, window functions (`RANK`, running `SUM() OVER`) in `analytics/sql/05_views.sql`
- Power Query: parameters, incremental refresh range filtering, conditional columns, manual reference tables merged via `Table.NestedJoin`
- DAX: time intelligence (`SAMEPERIODLASTYEAR`, `DATEADD`, `DATESINPERIOD`, `TOTALYTD`), `RANKX` leaderboard, variable-based measures
- Row-level security mirroring an existing app's RBAC model
