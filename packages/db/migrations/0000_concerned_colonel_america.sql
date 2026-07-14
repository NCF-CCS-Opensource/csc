CREATE TYPE "public"."event_type" AS ENUM('whole_day', 'half_day');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('student', 'officer', 'governor');--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"semester_id" uuid NOT NULL,
	"type" "event_type" NOT NULL,
	"half_day_penalty_amount" numeric(10, 2) NOT NULL,
	"officer_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "programs_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "semesters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_user_id" uuid,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"program" text NOT NULL,
	"student_id" text NOT NULL,
	"role" "role" DEFAULT 'student' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "students_auth_user_id_unique" UNIQUE("auth_user_id"),
	CONSTRAINT "students_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_semester_id_semesters_id_fk" FOREIGN KEY ("semester_id") REFERENCES "public"."semesters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_officer_id_students_id_fk" FOREIGN KEY ("officer_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_program_programs_name_fk" FOREIGN KEY ("program") REFERENCES "public"."programs"("name") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
INSERT INTO "programs" ("name") VALUES
	('Computer Science'),
	('Information Technology'),
	('Information System'),
	('ACT');