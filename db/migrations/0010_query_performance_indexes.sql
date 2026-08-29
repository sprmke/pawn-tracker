-- Foreign keys do not automatically create indexes in PostgreSQL.
-- These indexes cover the ownership, sharing, relation, and ordering columns
-- used by the application's list/detail queries.
CREATE INDEX IF NOT EXISTS "investors_user_id_idx" ON "investors" ("user_id");
CREATE INDEX IF NOT EXISTS "investors_investor_user_id_idx" ON "investors" ("investor_user_id");
CREATE INDEX IF NOT EXISTS "borrowers_user_id_idx" ON "borrowers" ("user_id");
CREATE INDEX IF NOT EXISTS "loans_user_id_idx" ON "loans" ("user_id");
CREATE INDEX IF NOT EXISTS "loans_borrower_id_idx" ON "loans" ("borrower_id");
CREATE INDEX IF NOT EXISTS "loans_due_date_idx" ON "loans" ("due_date");
CREATE INDEX IF NOT EXISTS "loan_investors_loan_id_idx" ON "loan_investors" ("loan_id");
CREATE INDEX IF NOT EXISTS "loan_investors_investor_id_idx" ON "loan_investors" ("investor_id");
CREATE INDEX IF NOT EXISTS "interest_periods_loan_investor_id_idx" ON "interest_periods" ("loan_investor_id");
CREATE INDEX IF NOT EXISTS "received_payments_loan_investor_id_idx" ON "received_payments" ("loan_investor_id");
CREATE INDEX IF NOT EXISTS "debts_user_id_idx" ON "debts" ("user_id");
CREATE INDEX IF NOT EXISTS "debts_investor_id_idx" ON "debts" ("investor_id");
CREATE INDEX IF NOT EXISTS "debt_received_payments_period_id_idx" ON "debt_received_payments" ("debt_interest_period_id");
CREATE INDEX IF NOT EXISTS "transactions_user_id_idx" ON "transactions" ("user_id");
CREATE INDEX IF NOT EXISTS "transactions_investor_id_idx" ON "transactions" ("investor_id");
CREATE INDEX IF NOT EXISTS "transactions_loan_id_idx" ON "transactions" ("loan_id");
CREATE INDEX IF NOT EXISTS "transactions_date_idx" ON "transactions" ("date");
