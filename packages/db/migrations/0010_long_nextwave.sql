ALTER TABLE "semesters" ADD COLUMN "saf_fee_amount" numeric(10, 2);--> statement-breakpoint
-- ADR 0024: the Semester open at rollout starts SAF tracking at ₱500; Semesters
-- already closed keep a null amount, meaning "before SAF tracking".
UPDATE "semesters" SET "saf_fee_amount" = 500 WHERE "closed_at" IS NULL;
