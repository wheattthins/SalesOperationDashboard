// Power Query (M) reference snippets for the Sales Operations Power BI model.
//
// These are NOT a full .pbix — paste each named block into Power BI Desktop
// via Home > Transform Data > Advanced Editor (or Manage Parameters for the
// parameter blocks). See powerbi/README.md for exactly where each one goes.
//
// Design intent: the star schema (analytics.dim_*, analytics.fact_*) is
// already built by the SQL ETL in analytics/sql/. Power Query here is used
// for the things that genuinely belong at the report layer — parameters,
// incremental refresh windows, and business categorizations an analyst wants
// to tweak without redeploying SQL — not to duplicate the ETL.

// ============================================================
// 1. Query parameters (Manage Parameters dialog)
// ============================================================

// Parameter: RangeStart (Date/Time, required for incremental refresh)
RangeStart = #datetime(2023, 1, 1, 0, 0, 0) meta [IsParameterQuery = true, Type = "DateTime", IsParameterQueryRequired = true]

// Parameter: RangeEnd (Date/Time, required for incremental refresh)
RangeEnd = #datetime(2026, 12, 31, 0, 0, 0) meta [IsParameterQuery = true, Type = "DateTime", IsParameterQueryRequired = true]

// Parameter: PBIEnvironment (Text, suggested values list) — swaps the Neon
// host/schema without touching every query when moving Dev -> Prod.
PBIEnvironment = "Production" meta [
    IsParameterQuery = true,
    List = {"Development", "Production"},
    DefaultValue = "Production",
    Type = "Text",
    IsParameterQueryRequired = true
]

// ============================================================
// 2. Shared connection function
// ============================================================
// A parameterized function instead of hard-coding the Postgres source in
// every query, so the ETL schema/host only needs to change in one place.

fn_GetAnalyticsTable = (tableName as text) as table =>
    let
        host = if PBIEnvironment = "Production" then "<your-neon-host>.neon.tech" else "<your-dev-host>.neon.tech",
        Source = PostgreSQL.Database(host, "neondb", [HierarchicalNavigation = true]),
        schema = Source{[Schema = "analytics", Item = tableName]}[Data]
    in
        schema

// ============================================================
// 3. FactSales — incremental refresh range filter + Deal Tier binning
// ============================================================
// RangeStart/RangeEnd here are the two parameters above, wired through
// Table.View / incremental refresh policy in the model settings.

FactSales =
    let
        Source = fn_GetAnalyticsTable("fact_sales"),
        #"Filtered Rows" = Table.SelectRows(
            Source,
            each [closed_date_key] >= Number.FromText(Date.ToText(RangeStart, "yyyyMMdd"))
                and [closed_date_key] <= Number.FromText(Date.ToText(RangeEnd, "yyyyMMdd"))
        ),
        // Deal-size tiering lives here (not in SQL) because sales/finance
        // iterate on these thresholds frequently and shouldn't need a
        // database migration to move a boundary.
        #"Added Deal Tier" = Table.AddColumn(#"Filtered Rows", "Deal Tier", each
            if [sale_price] >= 700000 then "Luxury"
            else if [sale_price] >= 350000 then "Mid-Market"
            else "Starter",
            type text
        )
    in
        #"Added Deal Tier"

// ============================================================
// 4. Lead source channel grouping — manual reference table + merge
// ============================================================
// A small lookup authored directly in Power Query ("Enter Data"), merged
// onto DimLeadSource. Lets marketing re-bucket channels without a SQL change.

ChannelGroupMap = Table.FromRows(
    {
        {"WEBSITE", "Digital"},
        {"ZILLOW", "Digital"},
        {"SOCIAL_MEDIA", "Digital"},
        {"REFERRAL", "Relationship"},
        {"WALK_IN", "Relationship"},
        {"COLD_CALL", "Outbound"}
    },
    {"source_code", "channel_group"}
)

DimLeadSource =
    let
        Source = fn_GetAnalyticsTable("dim_lead_source"),
        #"Merged with ChannelGroupMap" = Table.NestedJoin(
            Source, {"source_code"}, ChannelGroupMap, {"source_code"}, "ChannelGroup", JoinKind.LeftOuter
        ),
        #"Expanded ChannelGroup" = Table.ExpandTableColumn(
            #"Merged with ChannelGroupMap", "ChannelGroup", {"channel_group"}, {"Channel Group"}
        )
    in
        #"Expanded ChannelGroup"

// ============================================================
// 5. DimRep — current-version filter
// ============================================================
// dim_rep is SCD2 (one row per commissionRate version). The report's visible
// rep list should default to current versions only; historical versions stay
// in the table for point-in-time fact joins done upstream in SQL.

DimRepCurrent =
    let
        Source = fn_GetAnalyticsTable("dim_rep"),
        #"Filtered Rows" = Table.SelectRows(Source, each [is_current] = true)
    in
        #"Filtered Rows"
