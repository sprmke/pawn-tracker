CREATE TABLE IF NOT EXISTS "witnesses" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "name" text NOT NULL,
  "email" text,
  "contact_number" text,
  "address" text,
  "valid_id_url" text,
  "e_signature_url" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "witnesses_user_id_idx"
  ON "witnesses" ("user_id");

CREATE INDEX IF NOT EXISTS "witnesses_user_name_idx"
  ON "witnesses" ("user_id", "name");

ALTER TABLE "loan_signing_invitations"
  ADD COLUMN IF NOT EXISTS "witness_id" integer;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'loan_signing_invitations_witness_id_witnesses_id_fk'
  ) THEN
    ALTER TABLE "loan_signing_invitations"
      ADD CONSTRAINT "loan_signing_invitations_witness_id_witnesses_id_fk"
      FOREIGN KEY ("witness_id")
      REFERENCES "witnesses"("id")
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "loan_signing_invitations_witness_id_idx"
  ON "loan_signing_invitations" ("witness_id");
