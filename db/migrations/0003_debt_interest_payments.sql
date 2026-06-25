CREATE TABLE IF NOT EXISTS "debt_interest_periods" (
  "id" serial PRIMARY KEY NOT NULL,
  "debt_id" integer NOT NULL REFERENCES "debts"("id") ON DELETE cascade,
  "period_number" integer NOT NULL,
  "due_date" timestamp NOT NULL,
  "expected_interest" numeric(15, 2) NOT NULL,
  "status" "interest_period_status" DEFAULT 'Pending' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "debt_received_payments" (
  "id" serial PRIMARY KEY NOT NULL,
  "debt_interest_period_id" integer NOT NULL REFERENCES "debt_interest_periods"("id") ON DELETE cascade,
  "amount" numeric(15, 2) NOT NULL,
  "received_date" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "debt_interest_periods_debt_id_idx" ON "debt_interest_periods" ("debt_id");
