import "reflect-metadata";
import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Reflector } from "@nestjs/core";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { createDb, payments, penalties, semesters, events, attendanceSessions, students } from "@attendance/db";
import { TOKEN_VERIFIER } from "../src/shared/domain/token-verifier";
import { DB } from "../src/shared/infrastructure/db.module";
import { STUDENT_REPOSITORY } from "../src/modules/student/domain/student-repository";
import { DrizzleStudentRepository } from "../src/modules/student/infrastructure/drizzle-student.repository";
import { AuthGuard } from "../src/shared/presentation/auth.guard";
import { CapabilityGuard } from "../src/shared/presentation/capability.guard";
import { LEDGER_REPOSITORY } from "../src/modules/ledger/domain/ledger-repository";
import { DrizzleLedgerRepository } from "../src/modules/ledger/infrastructure/drizzle-ledger.repository";
import { LedgerUseCase } from "../src/modules/ledger/application/ledger.use-case";
import { LedgerController } from "../src/modules/ledger/presentation/ledger.controller";
import { createTestApp } from "./create-test-app";

const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString) throw new Error("TEST_DATABASE_URL is required");
if (!['127.0.0.1', 'localhost', '[::1]'].includes(new URL(connectionString).hostname)) {
  throw new Error("Integration tests only run against disposable local Postgres");
}
const db = createDb(connectionString);

describe("Ledger (e2e)", () => {
  let app: INestApplication;
  const verify = vi.fn();
  const bearer = "Bearer token";

  beforeAll(async () => {
    app = await createTestApp(
      [LedgerController],
      [
        { provide: DB, useValue: db },
        { provide: TOKEN_VERIFIER, useValue: { verify } },
        { provide: STUDENT_REPOSITORY, useClass: DrizzleStudentRepository },
        { provide: LEDGER_REPOSITORY, useClass: DrizzleLedgerRepository },
        LedgerUseCase,
        AuthGuard,
        CapabilityGuard,
        Reflector,
      ],
    );
  });

  afterAll(async () => app.close());
  const clearDatabase = async () => {
    await db.delete(payments);
    await db.delete(penalties);
    await db.delete(attendanceSessions);
    await db.delete(events);
    await db.delete(semesters);
    await db.delete(students);
  };
  beforeEach(async () => {
    verify.mockReset();
    await clearDatabase();
  });
  afterEach(clearDatabase);

  const server = () => app.getHttpServer();

  it("returns only the caller's payments, newest first", async () => {
    const [semester] = await db.insert(semesters).values({ startDate: "2026-06-01", endDate: "2026-10-31" }).returning();
    const [event] = await db.insert(events).values({
      name: "Foundation Day", semesterId: semester.id, date: "2026-07-15", type: "half_day", halfDayPenaltyAmount: "50.00",
    }).returning();
    const [student, otherStudent] = await db.insert(students).values([
      { email: "student@example.com", authUserId: "user_student", name: "Grace Hopper", program: "Computer Science", studentId: "24-001" },
      { email: "other@example.com", authUserId: "user_other", name: "Ada Lovelace", program: "Computer Science", studentId: "24-002" },
    ]).returning();
    verify.mockResolvedValue({ authUserId: student.authUserId });

    const [sessionOne, sessionTwo, otherSession] = await db.insert(attendanceSessions).values([
      { eventId: event.id, studentId: student.id, half: "am" },
      { eventId: event.id, studentId: student.id, half: "pm" },
      { eventId: event.id, studentId: otherStudent.id, half: "am" },
    ]).returning();
    const [penaltyOne, penaltyTwo, otherPenalty] = await db.insert(penalties).values([
      { attendanceSessionId: sessionOne.id, studentId: student.id, amount: "50.00" },
      { attendanceSessionId: sessionTwo.id, studentId: student.id, amount: "50.00" },
      { attendanceSessionId: otherSession.id, studentId: otherStudent.id, amount: "50.00" },
    ]).returning();
    await db.insert(payments).values([
      { penaltyId: penaltyOne.id, amount: "50.00", officerId: student.id, paidAt: new Date("2026-07-16T08:00:00.000Z") },
      { penaltyId: penaltyTwo.id, amount: "50.00", officerId: student.id, paidAt: new Date("2026-07-20T08:00:00.000Z") },
      { penaltyId: otherPenalty.id, amount: "50.00", officerId: otherStudent.id, paidAt: new Date("2026-07-18T08:00:00.000Z") },
    ]);

    const response = await request(server()).post("/ledger/mine/history").set("Authorization", bearer).send().expect(201);
    expect(response.body).toEqual([
      { id: expect.any(String), amount: "50.00", paidAt: "2026-07-20T08:00:00.000Z" },
      { id: expect.any(String), amount: "50.00", paidAt: "2026-07-16T08:00:00.000Z" },
    ]);
  });
});
