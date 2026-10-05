-- SCD2 merge for dim_rep: expire the current row for any rep whose
-- commissionRate has changed since the last ETL run, then insert a fresh
-- current row for every rep that either is brand new or just got expired.
-- Re-running this after editing a rep's commissionRate in the app is what
-- produces a second (historical) version in dim_rep.
WITH changed AS (
    SELECT dr.rep_sk
    FROM analytics.dim_rep dr
    JOIN public."User" u ON u.id = dr.rep_id
    WHERE dr.is_current
      AND u."role" = 'SALES_REP'
      AND u."commissionRate" IS DISTINCT FROM dr.commission_rate
)
UPDATE analytics.dim_rep
SET valid_to = CURRENT_TIMESTAMP, is_current = FALSE
WHERE rep_sk IN (SELECT rep_sk FROM changed);

-- Reps with no dim_rep row at all yet: backdate valid_from to the start of
-- time so existing historical facts (leads/sales/commissions created before
-- today) can still join to this version. We have no record of when their
-- rate actually took effect, so "always" is the only honest answer.
INSERT INTO analytics.dim_rep (rep_id, name, email, commission_rate, valid_from, valid_to, is_current)
SELECT u.id, u.name, u.email, u."commissionRate", TIMESTAMP '1900-01-01', NULL, TRUE
FROM public."User" u
WHERE u."role" = 'SALES_REP'
  AND NOT EXISTS (SELECT 1 FROM analytics.dim_rep dr WHERE dr.rep_id = u.id);

-- Reps whose rate just changed (expired above): the new version is only
-- effective from the moment we detected the change.
INSERT INTO analytics.dim_rep (rep_id, name, email, commission_rate, valid_from, valid_to, is_current)
SELECT u.id, u.name, u.email, u."commissionRate", CURRENT_TIMESTAMP, NULL, TRUE
FROM public."User" u
WHERE u."role" = 'SALES_REP'
  AND EXISTS (SELECT 1 FROM analytics.dim_rep dr WHERE dr.rep_id = u.id)
  AND NOT EXISTS (SELECT 1 FROM analytics.dim_rep dr WHERE dr.rep_id = u.id AND dr.is_current);

-- Conformed dimensions: small, static lookups shared by every fact table.
INSERT INTO analytics.dim_lead_source (source_code, source_label)
VALUES
  ('WEBSITE', 'Website'),
  ('REFERRAL', 'Referral'),
  ('ZILLOW', 'Zillow'),
  ('WALK_IN', 'Walk-In'),
  ('SOCIAL_MEDIA', 'Social Media'),
  ('COLD_CALL', 'Cold Call')
ON CONFLICT (source_code) DO NOTHING;

INSERT INTO analytics.dim_lead_status (status_code, status_label, pipeline_stage_order, is_closed, is_won)
VALUES
  ('NEW_LEAD', 'New Lead', 1, FALSE, FALSE),
  ('CONTACTED', 'Contacted', 2, FALSE, FALSE),
  ('SHOWING_SCHEDULED', 'Showing Scheduled', 3, FALSE, FALSE),
  ('OFFER_MADE', 'Offer Made', 4, FALSE, FALSE),
  ('CLOSED_WON', 'Closed Won', 5, TRUE, TRUE),
  ('CLOSED_LOST', 'Closed Lost', 6, TRUE, FALSE)
ON CONFLICT (status_code) DO NOTHING;
