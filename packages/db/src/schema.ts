import {
  date,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

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
  studentId: text("student_id").notNull().unique(),
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

export const eventTypeEnum = pgEnum("event_type", ["whole_day", "half_day"]);

// Owned by the Officer who created it, scoped to one Semester — see
// CONTEXT.md's Event entry. Whole-day penalty is derived (2x half-day),
// never stored — see lib/events.ts's deriveWholeDayPenalty().
export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  semesterId: uuid("semester_id")
    .notNull()
    .references(() => semesters.id),
  type: eventTypeEnum("type").notNull(),
  halfDayPenaltyAmount: numeric("half_day_penalty_amount", {
    precision: 10,
    scale: 2,
  }).notNull(),
  officerId: uuid("officer_id")
    .notNull()
    .references(() => students.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const halfEnum = pgEnum("half", ["am", "pm"]);

// One half (AM/PM) of an Event's day for one Student — see CONTEXT.md's
// Attendance Session entry. Absent unless both timeIn and timeOut are set;
// see lib/attendance.ts's isSessionAbsent(). Timestamps are the Officer's
// device capture time, not server receipt time — set by the caller.
export const attendanceSessions = pgTable(
  "attendance_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id),
    half: halfEnum("half").notNull(),
    timeIn: timestamp("time_in", { withTimezone: true }),
    timeOut: timestamp("time_out", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique().on(table.eventId, table.studentId, table.half)],
);

// A rejected Scan Approval — logged for fraud pattern detection, never
// written to an Attendance Session. studentId is null when the QR payload
// doesn't resolve to a registered Student (e.g. tampered/forged QR).
export const scanRejections = pgTable("scan_rejections", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id),
  studentId: uuid("student_id").references(() => students.id),
  qrPayload: text("qr_payload").notNull(),
  officerId: uuid("officer_id")
    .notNull()
    .references(() => students.id),
  scannedAt: timestamp("scanned_at", { withTimezone: true }).notNull(),
});
