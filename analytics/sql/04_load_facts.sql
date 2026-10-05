-- Full reload. Facts join to dim_rep on the rep's validity window so each
-- event is attributed to the commission rate that was actually in effect
-- at the time (point-in-time SCD2 lookup), not whatever rate is current today.
TRUNCATE analytics.fact_leads, analytics.fact_sales, analytics.fact_commission;

INSERT INTO analytics.fact_leads (lead_id, created_date_key, rep_sk, source_key, status_key, budget)
SELECT
    l.id,
    TO_CHAR(l."createdAt", 'YYYYMMDD')::INTEGER,
    dr.rep_sk,
    ds.source_key,
    dst.status_key,
    l.budget
FROM public."Lead" l
JOIN analytics.dim_rep dr
    ON dr.rep_id = l."assignedRepId"
    AND l."createdAt" >= dr.valid_from
    AND (dr.valid_to IS NULL OR l."createdAt" < dr.valid_to)
JOIN analytics.dim_lead_source ds ON ds.source_code = l."source"::TEXT
JOIN analytics.dim_lead_status dst ON dst.status_code = l."status"::TEXT;

INSERT INTO analytics.fact_sales (sale_id, lead_id, closed_date_key, rep_sk, sale_price, days_to_close)
SELECT
    s.id,
    s."leadId",
    TO_CHAR(s."closedAt", 'YYYYMMDD')::INTEGER,
    dr.rep_sk,
    s."salePrice",
    (s."closedAt"::DATE - l."createdAt"::DATE)
FROM public."Sale" s
JOIN public."Lead" l ON l.id = s."leadId"
JOIN analytics.dim_rep dr
    ON dr.rep_id = s."repId"
    AND s."closedAt" >= dr.valid_from
    AND (dr.valid_to IS NULL OR s."closedAt" < dr.valid_to);

INSERT INTO analytics.fact_commission (commission_id, sale_id, rep_sk, created_date_key, paid_date_key, rate, amount, status)
SELECT
    c.id,
    c."saleId",
    dr.rep_sk,
    TO_CHAR(c."createdAt", 'YYYYMMDD')::INTEGER,
    CASE WHEN c."paidAt" IS NOT NULL THEN TO_CHAR(c."paidAt", 'YYYYMMDD')::INTEGER END,
    c.rate,
    c.amount,
    c.status::TEXT
FROM public."Commission" c
JOIN analytics.dim_rep dr
    ON dr.rep_id = c."repId"
    AND c."createdAt" >= dr.valid_from
    AND (dr.valid_to IS NULL OR c."createdAt" < dr.valid_to);
