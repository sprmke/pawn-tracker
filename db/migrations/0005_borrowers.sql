CREATE TABLE IF NOT EXISTS "borrowers" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "name" text NOT NULL,
  "contact_number" text,
  "email" text,
  "address" text,
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "borrowers"
  ADD CONSTRAINT "borrowers_user_id_user_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "borrower_id" integer;

ALTER TABLE "loans"
  ADD CONSTRAINT "loans_borrower_id_borrowers_id_fk"
  FOREIGN KEY ("borrower_id") REFERENCES "borrowers"("id") ON DELETE restrict ON UPDATE no action;
