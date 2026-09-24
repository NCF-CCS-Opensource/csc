ALTER TABLE "payments" DROP CONSTRAINT "payments_penalty_id_unique";--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "voided_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "voided_by" uuid;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_voided_by_students_id_fk" FOREIGN KEY ("voided_by") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "payments_one_unvoided_per_penalty" ON "payments" USING btree ("penalty_id") WHERE "payments"."voided_at" is null;