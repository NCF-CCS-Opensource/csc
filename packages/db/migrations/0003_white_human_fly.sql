ALTER TABLE "attendance_sessions" DROP CONSTRAINT "attendance_sessions_event_id_events_id_fk";
--> statement-breakpoint
ALTER TABLE "payments" DROP CONSTRAINT "payments_penalty_id_penalties_id_fk";
--> statement-breakpoint
ALTER TABLE "penalties" DROP CONSTRAINT "penalties_attendance_session_id_attendance_sessions_id_fk";
--> statement-breakpoint
ALTER TABLE "scans" DROP CONSTRAINT "scans_event_id_events_id_fk";
--> statement-breakpoint
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_penalty_id_penalties_id_fk" FOREIGN KEY ("penalty_id") REFERENCES "public"."penalties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "penalties" ADD CONSTRAINT "penalties_attendance_session_id_attendance_sessions_id_fk" FOREIGN KEY ("attendance_session_id") REFERENCES "public"."attendance_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scans" ADD CONSTRAINT "scans_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;