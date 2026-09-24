ALTER TABLE "payments" ALTER COLUMN "penalty_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "student_id" uuid;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "semester_id" uuid;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_semester_id_semesters_id_fk" FOREIGN KEY ("semester_id") REFERENCES "public"."semesters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "payments_one_unvoided_saf_fee" ON "payments" USING btree ("student_id","semester_id") WHERE "payments"."voided_at" is null;--> statement-breakpoint
CREATE INDEX "payments_semester_id_idx" ON "payments" USING btree ("semester_id");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_one_target" CHECK (("payments"."penalty_id" is not null and "payments"."student_id" is null and "payments"."semester_id" is null) or ("payments"."penalty_id" is null and "payments"."student_id" is not null and "payments"."semester_id" is not null));