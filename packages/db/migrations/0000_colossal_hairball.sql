CREATE TYPE "public"."program" AS ENUM('Computer Science', 'Information Technology', 'Information System', 'ACT');--> statement-breakpoint
CREATE TABLE "students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_user_id" uuid,
	"email" text NOT NULL,
	"program" "program" NOT NULL,
	"student_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "students_auth_user_id_unique" UNIQUE("auth_user_id"),
	CONSTRAINT "students_email_unique" UNIQUE("email")
);
