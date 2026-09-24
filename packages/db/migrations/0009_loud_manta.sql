CREATE INDEX "attendance_sessions_student_id_idx" ON "attendance_sessions" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "payments_officer_id_idx" ON "payments" USING btree ("officer_id");--> statement-breakpoint
CREATE INDEX "penalties_student_id_idx" ON "penalties" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "scans_event_id_idx" ON "scans" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "scans_student_id_idx" ON "scans" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "scans_officer_id_idx" ON "scans" USING btree ("officer_id");--> statement-breakpoint
CREATE INDEX "scans_result_scanned_at_idx" ON "scans" USING btree ("result","scanned_at");