import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
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

// Governor-managed Expense Category vocabulary — see CONTEXT.md's Expense
// Category entry (issue #345). Mirrors programs: seeded with defaults in the
// migration. The future expenses table (#346) references this by name; that
// FK must be ON UPDATE CASCADE ON DELETE RESTRICT, so a rename propagates to
// existing Expenses (they never lose their classification, matching the admin
// rename copy) while a Category still in use can't be removed. Without the
// cascade, renaming an in-use Category would raise 23503 the rename path does
// not map.
export const expenseCategories = pgTable("expense_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const students = pgTable("students", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Identity-provider user id. Text, not uuid — Clerk ids are prefixed strings
  // (ADR 0012). Vendor-neutral name on purpose: vendors get swapped.
  // Non-null: a Student row is only created once the identity is known, so the
  // pending state lives in the identity provider, never here.
  authUserId: text("auth_user_id").notNull().unique(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  program: text("program")
    .notNull()
    .references(() => programs.name),
  // A current class grouping when it is known from the enrollment roster.
  // Manual onboarding has no authoritative source for it, so it stays null.
  section: text("section"),
  studentId: text("student_id").notNull().unique(),
  role: roleEnum("role").notNull().default("student"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Imported master-list record. It is deliberately separate from Student:
// a roster row predates Google sign-in and therefore has no auth_user_id.
// The verified school email is an optional convenience matcher; Student ID
// plus a name check handles rows where the spreadsheet has no GBox address.
export const enrollmentRoster = pgTable("enrollment_roster", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  middleName: text("middle_name"),
  program: text("program")
    .notNull()
    .references(() => programs.name),
  section: text("section").notNull(),
  studentId: text("student_id").notNull().unique(),
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
    // Null only for Semesters closed before SAF tracking began (ADR 0024);
    // the API requires an amount above zero on create and edit.
    safFeeAmount: numeric("saf_fee_amount", { precision: 10, scale: 2 }),
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
    // TM-3: who made the most recent manual grid correction (Present/Absent
    // override), if any. Null for a row that has only ever received booth
    // scans, or predates this column. Not touched by scan writes — only by
    // DrizzleAttendanceRepository#correct.
    correctedBy: uuid("corrected_by").references(() => students.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique().on(table.eventId, table.studentId, table.half),
    index("attendance_sessions_student_id_idx").on(table.studentId),
  ],
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
export const scans = pgTable(
  "scans",
  {
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
  },
  (table) => [
    index("scans_event_id_idx").on(table.eventId),
    index("scans_student_id_idx").on(table.studentId),
    index("scans_officer_id_idx").on(table.officerId),
    // Backs the rejections log's filter-by-result + sort-by-scannedAt query.
    index("scans_result_scanned_at_idx").on(table.result, table.scannedAt),
  ],
);

// One row per absent Attendance Session — see CONTEXT.md's Penalty entry.
// Auto-synced by lib/penalties.ts's computeSessionPenalty() whenever a
// session is written, never set manually; deleted when the session becomes
// present again. A whole-day absence is just the sum of both halves' rows —
// no separate aggregate is stored.
export const penalties = pgTable(
  "penalties",
  {
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
  },
  (table) => [index("penalties_student_id_idx").on(table.studentId)],
);

// Settles exactly one thing: a Penalty (penaltyId) or one Student's SAF Fee
// for one Semester (studentId + semesterId) — enforced by payments_one_target.
// At most one un-voided Payment per Penalty and per (Student, Semester) SAF
// Fee (partial unique indexes — both are paid in full, not partially) — see
// CONTEXT.md's Payment entry. Insert-only except for the one void update:
// voiding stamps voidedAt and voidedBy and keeps the row for audit; it is
// never deleted. Paying again after a void is a new row. amount is
// snapshotted at payment time rather than re-read from the Penalty or
// Semester, so the transaction record can't drift later.
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    penaltyId: uuid("penalty_id").references(() => penalties.id, { onDelete: "cascade" }),
    studentId: uuid("student_id").references(() => students.id),
    semesterId: uuid("semester_id").references(() => semesters.id),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    officerId: uuid("officer_id")
      .notNull()
      .references(() => students.id),
    paidAt: timestamp("paid_at", { withTimezone: true }).notNull().defaultNow(),
    voidedAt: timestamp("voided_at", { withTimezone: true }),
    voidedBy: uuid("voided_by").references(() => students.id),
  },
  (table) => [
    index("payments_officer_id_idx").on(table.officerId),
    uniqueIndex("payments_one_unvoided_per_penalty")
      .on(table.penaltyId)
      .where(sql`${table.voidedAt} is null`),
    uniqueIndex("payments_one_unvoided_saf_fee")
      .on(table.studentId, table.semesterId)
      .where(sql`${table.voidedAt} is null`),
    index("payments_semester_id_idx").on(table.semesterId),
    check(
      "payments_one_target",
      sql`(${table.penaltyId} is not null and ${table.studentId} is null and ${table.semesterId} is null) or (${table.penaltyId} is null and ${table.studentId} is not null and ${table.semesterId} is not null)`,
    ),
  ],
);
