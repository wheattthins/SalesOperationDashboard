-- Star schema for Power BI reporting, built alongside the OLTP tables in `public`.
-- Lives in its own schema so it can be rebuilt/truncated freely without touching app data.
CREATE SCHEMA IF NOT EXISTS analytics;

-- ============================================================
-- Dimensions
-- ============================================================

CREATE TABLE IF NOT EXISTS analytics.dim_date (
    date_key        INTEGER PRIMARY KEY,        -- YYYYMMDD
    full_date       DATE NOT NULL UNIQUE,
    year            SMALLINT NOT NULL,
    quarter         SMALLINT NOT NULL,
    month           SMALLINT NOT NULL,
    month_name      TEXT NOT NULL,
    week_of_year    SMALLINT NOT NULL,
    day_of_month    SMALLINT NOT NULL,
    day_of_week     SMALLINT NOT NULL,          -- ISO: 1 = Monday ... 7 = Sunday
    day_name        TEXT NOT NULL,
    is_weekend      BOOLEAN NOT NULL,
    year_month      TEXT NOT NULL                -- '2025-03', sorts correctly as text
);

-- Type 2 SCD on commissionRate: every rate change gets its own row with a
-- validity window, so facts can be joined to the rate that was active at the
-- time of the event instead of whatever the rep's rate happens to be today.
CREATE TABLE IF NOT EXISTS analytics.dim_rep (
    rep_sk          SERIAL PRIMARY KEY,
    rep_id          TEXT NOT NULL,               -- natural key -> public."User".id
    name            TEXT NOT NULL,
    email           TEXT NOT NULL,
    commission_rate DOUBLE PRECISION NOT NULL,
    valid_from      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valid_to        TIMESTAMP(3),                -- NULL = current version
    is_current      BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS dim_rep_rep_id_idx ON analytics.dim_rep (rep_id);
CREATE INDEX IF NOT EXISTS dim_rep_current_idx ON analytics.dim_rep (rep_id, is_current);

CREATE TABLE IF NOT EXISTS analytics.dim_lead_source (
    source_key      SERIAL PRIMARY KEY,
    source_code     TEXT NOT NULL UNIQUE,
    source_label    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS analytics.dim_lead_status (
    status_key           SERIAL PRIMARY KEY,
    status_code           TEXT NOT NULL UNIQUE,
    status_label           TEXT NOT NULL,
    pipeline_stage_order   SMALLINT NOT NULL,
    is_closed              BOOLEAN NOT NULL,
    is_won                 BOOLEAN NOT NULL
);

-- ============================================================
-- Facts
-- ============================================================

CREATE TABLE IF NOT EXISTS analytics.fact_leads (
    lead_id          TEXT PRIMARY KEY,           -- degenerate dimension, traces back to public."Lead"
    created_date_key INTEGER NOT NULL REFERENCES analytics.dim_date(date_key),
    rep_sk           INTEGER NOT NULL REFERENCES analytics.dim_rep(rep_sk),
    source_key       INTEGER NOT NULL REFERENCES analytics.dim_lead_source(source_key),
    status_key       INTEGER NOT NULL REFERENCES analytics.dim_lead_status(status_key),
    budget           DOUBLE PRECISION NOT NULL
);
CREATE INDEX IF NOT EXISTS fact_leads_rep_idx ON analytics.fact_leads (rep_sk);
CREATE INDEX IF NOT EXISTS fact_leads_date_idx ON analytics.fact_leads (created_date_key);

CREATE TABLE IF NOT EXISTS analytics.fact_sales (
    sale_id          TEXT PRIMARY KEY,
    lead_id          TEXT NOT NULL,
    closed_date_key  INTEGER NOT NULL REFERENCES analytics.dim_date(date_key),
    rep_sk           INTEGER NOT NULL REFERENCES analytics.dim_rep(rep_sk),
    sale_price       DOUBLE PRECISION NOT NULL,
    days_to_close    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS fact_sales_rep_idx ON analytics.fact_sales (rep_sk);
CREATE INDEX IF NOT EXISTS fact_sales_date_idx ON analytics.fact_sales (closed_date_key);

CREATE TABLE IF NOT EXISTS analytics.fact_commission (
    commission_id    TEXT PRIMARY KEY,
    sale_id          TEXT NOT NULL,
    rep_sk           INTEGER NOT NULL REFERENCES analytics.dim_rep(rep_sk),
    created_date_key INTEGER NOT NULL REFERENCES analytics.dim_date(date_key),
    paid_date_key    INTEGER REFERENCES analytics.dim_date(date_key),
    rate             DOUBLE PRECISION NOT NULL,
    amount           DOUBLE PRECISION NOT NULL,
    status           TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS fact_commission_rep_idx ON analytics.fact_commission (rep_sk);
CREATE INDEX IF NOT EXISTS fact_commission_status_idx ON analytics.fact_commission (status);
