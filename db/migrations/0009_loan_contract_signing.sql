CREATE TYPE "signing_party_role" AS ENUM ('borrower', 'lender', 'witness_1', 'witness_2');

CREATE TABLE IF NOT EXISTS "loan_contracts" (
  "id" serial PRIMARY KEY NOT NULL,
  "loan_id" integer NOT NULL UNIQUE REFERENCES "loans"("id") ON DELETE cascade,
  "customization" jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "loan_signing_invitations" (
  "id" serial PRIMARY KEY NOT NULL,
  "loan_id" integer NOT NULL REFERENCES "loans"("id") ON DELETE cascade,
  "contract_id" integer NOT NULL REFERENCES "loan_contracts"("id") ON DELETE cascade,
  "token" text NOT NULL UNIQUE,
  "party_role" "signing_party_role" NOT NULL,
  "investor_id" integer REFERENCES "investors"("id") ON DELETE set null,
  "party_name" text NOT NULL,
  "party_email" text,
  "signature_data_url" text,
  "signed_at" timestamp,
  "consented_at" timestamp,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "loan_signing_invitations_token_idx" ON "loan_signing_invitations" ("token");
CREATE INDEX IF NOT EXISTS "loan_signing_invitations_loan_id_idx" ON "loan_signing_invitations" ("loan_id");
