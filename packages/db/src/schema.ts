import { date, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["student", "officer", "governor"]);

// Governor-editable — see CONTEXT.md's Program entry. Seeded with the 4
// defaults in the migration; students.program references this by name.
export const programs = pgTable("programs", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const students = pgTable("students", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Null until the magic-link is verified (auth.users.id at that point).
  authUserId: uuid("auth_user_id").unique(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  program: text("program")
    .notNull()
    .references(() => programs.name),
  studentId: text("student_id").notNull(),
  role: roleEnum("role").notNull().default("student"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Governor-managed, date-ranged period. At most one open (closedAt is null)
// at a time — see CONTEXT.md's Semester entry.
export const semesters = pgTable("semesters", {
  id: uuid("id").primaryKey().defaultRandom(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
