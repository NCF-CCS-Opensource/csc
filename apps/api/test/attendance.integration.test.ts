import "reflect-metadata";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Reflector } from "@nestjs/core";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { attendanceSessions, createDb, events, payments, penalties, semesters, students } from "@attendance/db";
import { eq } from "drizzle-orm";
import { TOKEN_VERIFIER } from "../src/shared/domain/token-verifier";
import { DB } from "../src/shared/infrastructure/db.module";
import { STUDENT_REPOSITORY } from "../src/modules/student/domain/student-repository";
import { DrizzleStudentRepository } from "../src/modules/student/infrastructure/drizzle-student.repository";
import { AuthGuard } from "../src/shared/presentation/auth.guard";
import { CapabilityGuard } from "../src/shared/presentation/capability.guard";
import { AttendanceUseCase } from "../src/modules/attendance/application/attendance.use-case";
import { DrizzleAttendanceRepository } from "../src/modules/attendance/infrastructure/drizzle-attendance.repository";
import { AttendanceController } from "../src/modules/attendance/presentation/attendance.controller";
import { createTestApp } from "./create-test-app";

const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString) throw new Error("TEST_DATABASE_URL is required");
if (!['127.0.0.1', 'localhost', '[::1]'].includes(new URL(connectionString).hostname)) {
  throw new Error("Integration tests only run against disposable local Postgres");
}
const db = createDb(connectionString);

describe("Attendance, Penalty and Payment (e2e)", () => {
  let app: INestApplication;
  const verify = vi.fn();
  const bearer = "Bearer token";

  beforeAll(async () => {
    app = await createTestApp(
      [AttendanceController],
      [
        { provide: DB, useValue: db },
        { provide: TOKEN_VERIFIER, useValue: { verify } },
        { provide: STUDENT_REPOSITORY, useClass: DrizzleStudentRepository },
        AttendanceUseCase,
        DrizzleAttendanceRepository,
        AuthGuard,
        CapabilityGuard,
        Reflector,
      ],
    );
  });

  afterAll(async () => app.close());
  const clear = async () => {
    await db.delete(payments);
    await db.delete(penalties);
    await db.delete(attendanceSessions);
    await db.delete(events);
    await db.delete(semesters);
    await db.delete(students);
  };
  beforeEach(async () => { verify.mockReset(); await clear(); });
  afterEach(clear);

  async function fixture(role: "officer" | "student" = "officer", type: "half_day" | "whole_day" = "half_day", closed = true) {
    const [semester] = await db.insert(semesters).values({ startDate: "2026-01-01", endDate: "2026-12-31", closedAt: closed ? new Date() : null }).returning();
    const [event] = await db.insert(events).values({ name: "Foundation Day", semesterId: semester.id, date: "2026-07-15", type, halfDayPenaltyAmount: "50.00" }).returning();
    const [student, actor] = await db.insert(students).values([
      { email: "student@example.com", authUserId: "student", name: "Grace Hopper", program: "Computer Science", studentId: "24-001" },
      { email: "actor@example.com", authUserId: "actor", name: "Ada Lovelace", program: "Computer Science", studentId: "24-002", role },
    ]).returning();
    verify.mockResolvedValue({ authUserId: actor.authUserId });
    return { event, student, actor };
  }

  const server = () => app.getHttpServer();
  const post = (path: string, body: Record<string, unknown>) => request(server()).post(path).set("Authorization", bearer).send(body);

  it("uses a noon sentinel for Present, clears Absent, and recomputes its Penalty", async () => {
    const { event, student } = await fixture();
    const [session] = await db.insert(attendanceSessions).values({ eventId: event.id, studentId: student.id, half: "am" }).returning();
    await post("/attendance/correct", { sessionId: session.id, field: "timeIn", present: true }).expect(201);
    expect(await db.query.attendanceSessions.findFirst({ where: eq(attendanceSessions.id, session.id) })).toMatchObject({ timeIn: new Date("2026-07-15T12:00:00+08:00") });
    expect(await db.query.penalties.findFirst()).toMatchObject({ amount: "50.00" });
    await post("/attendance/correct", { sessionId: session.id, field: "timeOut", present: true }).expect(201);
    expect(await db.query.penalties.findFirst()).toBeUndefined();
    await post("/attendance/correct", { sessionId: session.id, field: "timeOut", present: false }).expect(201);
    expect(await db.query.attendanceSessions.findFirst({ where: eq(attendanceSessions.id, session.id) })).toMatchObject({ timeOut: null });
    expect(await db.query.penalties.findFirst()).toMatchObject({ amount: "50.00" });
  });

  it("charges whole-day absences as two half-day penalties and records immutable payments", async () => {
    const { event, student, actor } = await fixture("officer", "whole_day");
    const [am, pm] = await db.insert(attendanceSessions).values([
      { eventId: event.id, studentId: student.id, half: "am" },
      { eventId: event.id, studentId: student.id, half: "pm" },
    ]).returning();
    await post("/attendance/correct", { sessionId: am.id, field: "timeIn", present: false }).expect(201);
    await post("/attendance/correct", { sessionId: pm.id, field: "timeIn", present: false }).expect(201);
    const penaltyRows = await db.query.penalties.findMany();
    expect(penaltyRows.map((penalty) => penalty.amount)).toEqual(["50.00", "50.00"]);
    await post("/attendance/payments", { penaltyIds: penaltyRows.map((penalty) => penalty.id) }).expect(201);
    await post("/attendance/payments", { penaltyIds: penaltyRows.map((penalty) => penalty.id) }).expect(201);
    expect(await db.query.payments.findMany()).toHaveLength(2);
    expect(await db.query.payments.findFirst()).toMatchObject({ amount: "50.00", officerId: actor.id });
  });

  it("allows attendance correction and payment recording after Semester closure", async () => {
    const { event, student } = await fixture();
    const [session] = await db.insert(attendanceSessions).values({ eventId: event.id, studentId: student.id, half: "am" }).returning();
    await post("/attendance/correct", { sessionId: session.id, field: "timeIn", present: false }).expect(201);
    const penalty = await db.query.penalties.findFirst();
    await post("/attendance/payments", { penaltyIds: [penalty!.id] }).expect(201);
    expect(await db.query.payments.findFirst()).toBeDefined();
  });

  it("refuses an Officer correcting their own Attendance Session (TM-2)", async () => {
    const { event, actor } = await fixture();
    const [session] = await db.insert(attendanceSessions).values({ eventId: event.id, studentId: actor.id, half: "am" }).returning();
    await post("/attendance/correct", { sessionId: session.id, field: "timeIn", present: true }).expect(403);
    expect(await db.query.attendanceSessions.findFirst({ where: eq(attendanceSessions.id, session.id) })).toMatchObject({ timeIn: null });
  });

  it("refuses an Officer recording a payment against their own Penalty (TM-2)", async () => {
    const { event, actor } = await fixture();
    const [session] = await db.insert(attendanceSessions).values({ eventId: event.id, studentId: actor.id, half: "am" }).returning();
    const [penalty] = await db.insert(penalties).values({ studentId: actor.id, attendanceSessionId: session.id, amount: "50.00" }).returning();
    await post("/attendance/payments", { penaltyIds: [penalty.id] }).expect(403);
    expect(await db.query.payments.findFirst()).toBeUndefined();
  });

  async function absentPenalty(eventId: string, studentId: string) {
    const [session] = await db.insert(attendanceSessions).values({ eventId, studentId, half: "am" }).returning();
    await post("/attendance/correct", { sessionId: session.id, field: "timeIn", present: false }).expect(201);
    return (await db.query.penalties.findFirst())!;
  }

  async function gridRow(eventId: string, studentId: string) {
    const { body } = await post("/attendance/grid", { eventId }).expect(201);
    return body.rows.find((row: { studentId: string }) => row.studentId === studentId);
  }

  it.each([["open", false], ["closed", true]])("voids a Payment in a %s Semester, keeps it for audit, and lets the Penalty be paid again", async (_label, closed) => {
    const { event, student, actor } = await fixture("officer", "half_day", closed);
    const penalty = await absentPenalty(event.id, student.id);
    await post("/attendance/payments", { penaltyIds: [penalty.id] }).expect(201);
    const payment = (await db.query.payments.findFirst())!;
    expect(await gridRow(event.id, student.id)).toMatchObject({ settled: true, unpaidPenaltyIds: [], paidPaymentIds: [payment.id] });

    await post("/attendance/payments/void", { paymentId: payment.id }).expect(201);
    expect(await db.query.payments.findFirst({ where: eq(payments.id, payment.id) })).toMatchObject({ voidedBy: actor.id, voidedAt: expect.any(Date) });
    expect(await gridRow(event.id, student.id)).toMatchObject({ settled: false, outstanding: 50, unpaidPenaltyIds: [penalty.id], paidPaymentIds: [] });

    await post("/attendance/payments", { penaltyIds: [penalty.id] }).expect(201);
    await post("/attendance/payments", { penaltyIds: [penalty.id] }).expect(201);
    const rows = await db.query.payments.findMany();
    expect(rows).toHaveLength(2);
    expect(rows.filter((row) => !row.voidedAt)).toHaveLength(1);
    expect(await gridRow(event.id, student.id)).toMatchObject({ settled: true, unpaidPenaltyIds: [] });
  });

  it("rejects voiding an already-voided Payment with 409 and an unknown one with 404", async () => {
    const { event, student } = await fixture();
    const penalty = await absentPenalty(event.id, student.id);
    await post("/attendance/payments", { penaltyIds: [penalty.id] }).expect(201);
    const payment = (await db.query.payments.findFirst())!;
    await post("/attendance/payments/void", { paymentId: payment.id }).expect(201);
    await post("/attendance/payments/void", { paymentId: payment.id }).expect(409);
    await post("/attendance/payments/void", { paymentId: "00000000-0000-0000-0000-000000000000" }).expect(404);
  });

  it("refuses to let a Student void a Payment", async () => {
    const { event, student, actor } = await fixture("student");
    const [session] = await db.insert(attendanceSessions).values({ eventId: event.id, studentId: student.id, half: "am" }).returning();
    const [penalty] = await db.insert(penalties).values({ attendanceSessionId: session.id, studentId: student.id, amount: "50.00" }).returning();
    const [payment] = await db.insert(payments).values({ penaltyId: penalty.id, amount: "50.00", officerId: actor.id }).returning();
    await post("/attendance/payments/void", { paymentId: payment.id }).expect(403);
    expect(await db.query.payments.findFirst()).toMatchObject({ voidedAt: null });
  });

  it("refuses a Student actor", async () => {
    const { event } = await fixture("student");
    const response = await post("/attendance/grid", { eventId: event.id });
    expect(response.status).toBe(403);
  });
});
