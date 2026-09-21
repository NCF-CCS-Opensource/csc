import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import {
  attendanceSessions,
  events,
  payments,
  penalties,
  semesters,
  students,
} from "@attendance/db";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "./db";

// Covers what's still genuinely DB-backed in apps/web: the my-attendance
// payment-history join (no API-side read exists yet). deleteSemester and
// promoteToOfficer moved to apps/api's semester/delete and student/promote
// endpoints and are covered there (semester-event-lifecycle.integration.test.ts,
// student-correction.integration.test.ts).
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required");

const host = new URL(connectionString).hostname;
if (!["127.0.0.1", "localhost", "[::1]"].includes(host)) {
  throw new Error("Integration tests only run against disposable local Postgres");
}

beforeEach(async () => {
  await db.delete(payments);
  await db.delete(penalties);
  await db.delete(attendanceSessions);
  await db.delete(events);
  await db.delete(students);
  await db.delete(semesters);
});

describe("my-attendance/actions.ts's payment-history query", () => {
  it("joins payments to a Student through penalties, newest first", async () => {
    const suffix = randomUUID();
    const [student] = await db
      .insert(students)
      .values({
        authUserId: `user_${suffix}`,
        email: `${suffix}@gbox.ncf.edu.ph`,
        name: "Test Student",
        program: "Computer Science",
        studentId: suffix,
      })
      .returning();
    const [semester] = await db
      .insert(semesters)
      .values({ startDate: "2026-01-01", endDate: "2026-05-31" })
      .returning();
    const [event] = await db
      .insert(events)
      .values({
        semesterId: semester.id,
        name: "Foundation Day",
        date: "2026-02-01",
        type: "half_day",
        halfDayPenaltyAmount: "50.00",
      })
      .returning();
    const sessions = await db
      .insert(attendanceSessions)
      .values([
        { eventId: event.id, studentId: student.id, half: "am" },
        { eventId: event.id, studentId: student.id, half: "pm" },
      ])
      .returning();
    const penaltyRows = await db
      .insert(penalties)
      .values(
        sessions.map((session) => ({
          attendanceSessionId: session.id,
          studentId: student.id,
          amount: "50.00",
        })),
      )
      .returning();
    await db.insert(payments).values([
      { penaltyId: penaltyRows[0].id, amount: "20.00", officerId: student.id, paidAt: new Date("2026-01-01") },
      { penaltyId: penaltyRows[1].id, amount: "30.00", officerId: student.id, paidAt: new Date("2026-02-01") },
    ]);

    const rows = await db
      .select({ id: payments.id, amount: payments.amount, paidAt: payments.paidAt })
      .from(payments)
      .innerJoin(penalties, eq(payments.penaltyId, penalties.id))
      .innerJoin(students, eq(penalties.studentId, students.id))
      .where(eq(students.authUserId, student.authUserId))
      .orderBy(desc(payments.paidAt));

    expect(rows.map((r) => r.amount)).toEqual(["30.00", "20.00"]);
  });
});
