import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
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

// Covers what's still genuinely DB-backed in apps/web (see the PR's Known
// Gaps): admin/actions.ts's deleteSemester/promoteToOfficer, and the
// my-attendance payment-history join. Everything else moved to apps/api and
// is covered there — this only proves the queries these leftover call sites
// depend on still behave the way those call sites assume.
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

describe("admin/actions.ts#deleteSemester's query", () => {
  it("deletes a Semester with no Events under it", async () => {
    const [semester] = await db
      .insert(semesters)
      .values({ startDate: "2026-01-01", endDate: "2026-05-31" })
      .returning();

    await db.delete(semesters).where(eq(semesters.id, semester.id));

    expect(await db.query.semesters.findFirst({ where: eq(semesters.id, semester.id) })).toBeUndefined();
  });
});

describe("admin/actions.ts#promoteToOfficer's query", () => {
  it("promotes a Student but not an existing Officer", async () => {
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

    await db
      .update(students)
      .set({ role: "officer" })
      .where(and(eq(students.id, student.id), eq(students.role, "student")));

    expect(
      (await db.query.students.findFirst({ where: eq(students.id, student.id) }))?.role,
    ).toBe("officer");

    // Re-running against an already-promoted row is a no-op, not a demotion.
    await db
      .update(students)
      .set({ role: "student" })
      .where(and(eq(students.id, student.id), eq(students.role, "student")));

    expect(
      (await db.query.students.findFirst({ where: eq(students.id, student.id) }))?.role,
    ).toBe("officer");
  });
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
