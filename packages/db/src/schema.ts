import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Fixed Program list — see CONTEXT.md's Program entry.
export const programEnum = pgEnum("program", [
  "Computer Science",
  "Information Technology",
  "Information System",
  "ACT",
]);

export const students = pgTable("students", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Null until the magic-link is verified (auth.users.id at that point).
  authUserId: uuid("auth_user_id").unique(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  program: programEnum("program").notNull(),
  studentId: text("student_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
