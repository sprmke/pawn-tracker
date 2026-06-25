ALTER TABLE "debts" ADD COLUMN IF NOT EXISTS "duration_months" integer DEFAULT 12 NOT NULL;
