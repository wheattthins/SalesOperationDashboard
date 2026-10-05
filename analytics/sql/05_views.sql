-- Optional ad-hoc analysis view: monthly revenue per rep with a running
-- total and a within-month rank. Not consumed by the Power BI model (that
-- logic lives in DAX there) — this is here as a standalone SQL artifact for
-- analysts who want the answer straight from Postgres.
DROP MATERIALIZED VIEW IF EXISTS analytics.mv_rep_monthly_performance;

CREATE MATERIALIZED VIEW analytics.mv_rep_monthly_performance AS
WITH monthly AS (
    SELECT
        dr.rep_id,
        dr.name AS rep_name,
        dd.year,
        dd.month,
        dd.year_month,
        SUM(fs.sale_price) AS monthly_revenue,
        COUNT(*) AS deals_closed
    FROM analytics.fact_sales fs
    JOIN analytics.dim_rep dr ON dr.rep_sk = fs.rep_sk
    JOIN analytics.dim_date dd ON dd.date_key = fs.closed_date_key
    GROUP BY dr.rep_id, dr.name, dd.year, dd.month, dd.year_month
)
SELECT
    *,
    SUM(monthly_revenue) OVER (PARTITION BY rep_id ORDER BY year, month) AS running_total_revenue,
    RANK() OVER (PARTITION BY year, month ORDER BY monthly_revenue DESC) AS month_rank
FROM monthly;

CREATE UNIQUE INDEX IF NOT EXISTS mv_rep_monthly_performance_pk
    ON analytics.mv_rep_monthly_performance (rep_id, year, month);
