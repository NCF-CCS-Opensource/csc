import { sql } from "drizzle-orm";
import {
  date,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
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
export const semesters = pgTable(
  "semesters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("semesters_one_open")
      .on(sql`(1)`)
      .where(sql`${table.closedAt} is null`),
  ],
);

export const eventTypeEnum = pgEnum("event_type", ["whole_day", "half_day"]);

// Scoped to one Semester — see CONTEXT.md's Event entry. No per-Officer
// ownership: every Officer sees and CRUDs every Event (ADR 0007), so there is
// no officer_id here. Whole-day penalty is derived (2x half-day), never stored
// — see lib/events.ts's deriveWholeDayPenalty(). The Event lifecycle command
// permits hard deletion only before any Scan or Attendance Session exists.
export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  semesterId: uuid("semester_id")
    .notNull()
    .references(() => semesters.id),
  date: date("date").notNull(),
  // Free-form, e.g. "ST Quad" — nullable, no venue concept enforced.
  venue: text("venue"),
  type: eventTypeEnum("type").notNull(),
  halfDayPenaltyAmount: numeric("half_day_penalty_amount", {
    precision: 10,
    scale: 2,
  }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const halfEnum = pgEnum("half", ["am", "pm"]);

// One half (AM/PM) of an Event's day for one Student — see CONTEXT.md's
// Attendance Session entry. Absent unless both timeIn and timeOut are set;
// see lib/scan.ts's isSessionAbsent(). Timestamps are the Officer's
// device capture time, not server receipt time — set by the caller.
export const attendanceSessions = pgTable(
  "attendance_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
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

export const scanResultEnum = pgEnum("scan_result", ["approved", "rejected"]);
export const boothModeEnum = pgEnum("booth_mode", [
  "time_in_am",
  "time_out_am",
  "time_in_pm",
  "time_out_pm",
]);

// One Scan Approval decision (approve or reject) — see CONTEXT.md's Scan
// Approval entry. `id` is CLIENT-generated (not defaultRandom): the mobile
// booth app tags every scan with a UUID when it's taken, offline or not, and
// resyncs by that id, so a retried sync upserts instead of duplicating.
// Rejections are logged here but never touch an Attendance Session.
// studentId is null when the QR payload doesn't resolve to a registered
// Student (e.g. tampered/forged QR).
export const scans = pgTable("scans", {
  id: uuid("id").primaryKey(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  studentId: uuid("student_id").references(() => students.id),
  qrPayload: text("qr_payload").notNull(),
  result: scanResultEnum("result").notNull(),
  // Which booth mode was selected. Null for an explicit rejection; retained
  // on invalid approval attempts so replay preserves the original decision.
  mode: boothModeEnum("mode"),
  officerId: uuid("officer_id")
    .notNull()
    .references(() => students.id),
  // The Officer's device capture time — not server receipt time.
  scannedAt: timestamp("scanned_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// One row per absent Attendance Session — see CONTEXT.md's Penalty entry.
// Auto-synced by lib/penalties.ts's computeSessionPenalty() whenever a
// session is written, never set manually; deleted when the session becomes
// present again. A whole-day absence is just the sum of both halves' rows —
// no separate aggregate is stored.
export const penalties = pgTable("penalties", {
  id: uuid("id").primaryKey().defaultRandom(),
  attendanceSessionId: uuid("attendance_session_id")
    .notNull()
    .unique()
    .references(() => attendanceSessions.id, { onDelete: "cascade" }),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// One Payment per Penalty (unique on penaltyId — a Penalty is paid in full,
// not partially) — see CONTEXT.md's Payment entry. Insert-only: there is no
// update/delete path anywhere in the app. A correction is a new row, not an
// edit to this one. amount is snapshotted at payment time rather than
// re-read from the Penalty, so the transaction record can't drift later.
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  penaltyId: uuid("penalty_id")
    .notNull()
    .unique()
    .references(() => penalties.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  officerId: uuid("officer_id")
    .notNull()
    .references(() => students.id),
  paidAt: timestamp("paid_at", { withTimezone: true }).notNull().defaultNow(),
});
