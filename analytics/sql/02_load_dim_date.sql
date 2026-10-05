-- Rebuild the date spine: 3 years of history plus 1 year of headroom for
-- forward-looking Power BI measures (e.g. target dates, forecast placeholders).
-- CASCADE also clears the fact tables (they get reloaded in 04_load_facts.sql
-- anyway), since they hold FKs into dim_date.
TRUNCATE analytics.dim_date CASCADE;

INSERT INTO analytics.dim_date (
    date_key, full_date, year, quarter, month, month_name,
    week_of_year, day_of_month, day_of_week, day_name, is_weekend, year_month
)
SELECT
    TO_CHAR(d, 'YYYYMMDD')::INTEGER,
    d::DATE,
    EXTRACT(YEAR FROM d)::SMALLINT,
    EXTRACT(QUARTER FROM d)::SMALLINT,
    EXTRACT(MONTH FROM d)::SMALLINT,
    TRIM(TO_CHAR(d, 'Month')),
    EXTRACT(WEEK FROM d)::SMALLINT,
    EXTRACT(DAY FROM d)::SMALLINT,
    EXTRACT(ISODOW FROM d)::SMALLINT,
    TRIM(TO_CHAR(d, 'Day')),
    EXTRACT(ISODOW FROM d) IN (6, 7),
    TO_CHAR(d, 'YYYY-MM')
FROM generate_series(
    (CURRENT_DATE - INTERVAL '3 years')::DATE,
    (CURRENT_DATE + INTERVAL '1 year')::DATE,
    INTERVAL '1 day'
) AS d;
