CREATE TABLE "enrollment_roster" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"middle_name" text,
	"program" text NOT NULL,
	"section" text NOT NULL,
	"student_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "enrollment_roster_email_unique" UNIQUE("email"),
	CONSTRAINT "enrollment_roster_student_id_unique" UNIQUE("student_id")
);
--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "section" text;--> statement-breakpoint
ALTER TABLE "enrollment_roster" ADD CONSTRAINT "enrollment_roster_program_programs_name_fk" FOREIGN KEY ("program") REFERENCES "public"."programs"("name") ON DELETE no action ON UPDATE no action;