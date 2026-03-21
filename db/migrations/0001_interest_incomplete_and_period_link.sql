-- Run once against your Postgres database (Neon, etc.)
-- Adds "Incomplete" period status and links received_payments to interest_periods.
--
-- Note: `ADD VALUE IF NOT EXISTS` requires PostgreSQL 15+. On older versions,
-- use: ALTER TYPE interest_period_status ADD VALUE 'Incomplete';

ALTER TYPE interest_period_status ADD VALUE IF NOT EXISTS 'Incomplete';

ALTER TABLE received_payments
  ADD COLUMN IF NOT EXISTS interest_period_id integer REFERENCES interest_periods(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS received_payments_interest_period_id_idx
  ON received_payments (interest_period_id);
