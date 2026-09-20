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

  async function fixture(role: "officer" | "student" = "officer", type: "half_day" | "whole_day" = "half_day") {
    const [semester] = await db.insert(semesters).values({ startDate: "2026-01-01", endDate: "2026-12-31", closedAt: new Date() }).returning();
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

  it("refuses a Student actor", async () => {
    const { event } = await fixture("student");
    const response = await post("/attendance/grid", { eventId: event.id });
    expect(response.status).toBe(403);
  });
});
