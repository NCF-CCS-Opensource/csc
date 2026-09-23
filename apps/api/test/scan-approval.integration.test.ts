import "reflect-metadata";
import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Reflector } from "@nestjs/core";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { eq, sql } from "drizzle-orm";
import { attendanceSessions, createDb, events, penalties, scans, semesters, students } from "@attendance/db";
import { TOKEN_VERIFIER } from "../src/shared/domain/token-verifier";
import { DB } from "../src/shared/infrastructure/db.module";
import { STUDENT_REPOSITORY } from "../src/modules/student/domain/student-repository";
import { DrizzleStudentRepository } from "../src/modules/student/infrastructure/drizzle-student.repository";
import { AuthGuard } from "../src/shared/presentation/auth.guard";
import { CapabilityGuard } from "../src/shared/presentation/capability.guard";
import { ScanApprovalUseCase } from "../src/modules/scan/application/scan-approval.use-case";
import { DrizzleScanRepository } from "../src/modules/scan/infrastructure/drizzle-scan.repository";
import { ScanController } from "../src/modules/scan/presentation/scan.controller";
import { createTestApp } from "./create-test-app";

const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString) throw new Error("TEST_DATABASE_URL is required");
if (!['127.0.0.1', 'localhost', '[::1]'].includes(new URL(connectionString).hostname)) {
  throw new Error("Integration tests only run against disposable local Postgres");
}
const db = createDb(connectionString);

describe("Scan Approval (e2e)", () => {
  let app: INestApplication;
  const verify = vi.fn();
  const bearer = "Bearer token";

  beforeAll(async () => {
    app = await createTestApp(
      [ScanController],
      [
        { provide: DB, useValue: db },
        { provide: TOKEN_VERIFIER, useValue: { verify } },
        { provide: STUDENT_REPOSITORY, useClass: DrizzleStudentRepository },
        ScanApprovalUseCase,
        DrizzleScanRepository,
        AuthGuard,
        CapabilityGuard,
        Reflector,
      ],
    );
  });

  afterAll(async () => app.close());
  const clearDatabase = async () => {
    await db.delete(penalties);
    await db.delete(scans);
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

  async function fixture() {
    const [semester] = await db.insert(semesters).values({ startDate: "2026-06-01", endDate: "2026-10-31" }).returning();
    const [event] = await db.insert(events).values({
      name: "Foundation Day", semesterId: semester.id, date: "2026-07-15", type: "half_day", halfDayPenaltyAmount: "50.00",
    }).returning();
    const [student, officer] = await db.insert(students).values([
      { email: "student@example.com", authUserId: "user_student", name: "Grace Hopper", program: "Computer Science", studentId: "24-001" },
      { email: "officer@example.com", authUserId: "user_officer", name: "Ada Lovelace", program: "Computer Science", studentId: "24-002", role: "officer" },
    ]).returning();
    verify.mockResolvedValue({ authUserId: officer.authUserId });
    return { event, student, officer };
  }

  const server = () => app.getHttpServer();
  const qr = (student: { name: string; studentId: string; program: string }) => JSON.stringify({ name: student.name, studentId: student.studentId, program: student.program });
  const approve = (body: Record<string, unknown>) => request(server()).post("/scan/approve").set("Authorization", bearer).send(body);

  it("reveals only canonical QR details and retains invalid approvals as rejections", async () => {
    const { event, student } = await fixture();
    await request(server()).post("/scan/identify").set("Authorization", bearer).send({ qrPayload: qr(student) })
      .expect(201, { student: { name: student.name, studentId: student.studentId, program: student.program } });
    await request(server()).post("/scan/identify").set("Authorization", bearer).send({ qrPayload: "not-json" })
      .expect(422);
    await approve({ scanId: randomUUID(), eventId: event.id, mode: "time_in_am", qrPayload: "not-json", scannedAt: "2026-07-15T08:00:00.000Z" }).expect(422);
    expect(await db.query.scans.findFirst()).toMatchObject({ result: "rejected", studentId: null });
    expect(await db.query.attendanceSessions.findFirst()).toBeUndefined();
  });

  it("writes Scan, Attendance Session, and Penalty atomically", async () => {
    const { event, student } = await fixture();
    const scanId = randomUUID();
    await approve({ scanId, eventId: event.id, mode: "time_in_am", qrPayload: qr(student), scannedAt: "2026-07-15T08:00:00.000Z" }).expect(201);
    expect(await db.query.scans.findFirst({ where: eq(scans.id, scanId) })).toMatchObject({ result: "approved", studentId: student.id });
    expect(await db.query.attendanceSessions.findFirst()).toMatchObject({ eventId: event.id, studentId: student.id, half: "am", timeIn: new Date("2026-07-15T08:00:00.000Z") });
    expect(await db.query.penalties.findFirst()).toMatchObject({ studentId: student.id, amount: "50.00" });
  });

  it("refuses an Officer approving a scan of their own QR (TM-2)", async () => {
    const { event, officer } = await fixture();
    await approve({
      scanId: randomUUID(),
      eventId: event.id,
      mode: "time_in_am",
      qrPayload: qr(officer),
      scannedAt: "2026-07-15T08:00:00.000Z",
    }).expect(403);
    expect(await db.query.attendanceSessions.findFirst()).toBeUndefined();
  });

  it("rolls back Scan and Attendance when Penalty persistence fails", async () => {
    const { event, student } = await fixture();
    await db.execute(sql`create function fail_penalty_insert() returns trigger language plpgsql as $$ begin raise exception 'forced penalty failure'; end; $$`);
    await db.execute(sql`create trigger fail_penalty before insert on penalties for each row execute function fail_penalty_insert()`);
    try {
      await approve({ scanId: randomUUID(), eventId: event.id, mode: "time_in_am", qrPayload: qr(student), scannedAt: "2026-07-15T08:00:00.000Z" }).expect(500);
    } finally {
      await db.execute(sql`drop trigger fail_penalty on penalties`);
      await db.execute(sql`drop function fail_penalty_insert()`);
    }
    expect(await db.query.scans.findFirst()).toBeUndefined();
    expect(await db.query.attendanceSessions.findFirst()).toBeUndefined();
  });

  it("is idempotent, detects conflicts, and reports fresh same-mode rescans", async () => {
    const { event, student } = await fixture();
    const body = { scanId: randomUUID(), eventId: event.id, mode: "time_in_am", qrPayload: qr(student), scannedAt: "2026-07-15T08:00:00.000Z" };
    expect((await approve(body).expect(201)).body.alreadyScanned).toBe(false);
    expect((await approve(body).expect(201)).body.alreadyScanned).toBe(true);
    expect((await approve({ ...body, scanId: randomUUID(), scannedAt: "2026-07-15T08:05:00.000Z" }).expect(201)).body.alreadyScanned).toBe(true);
    await approve({ ...body, scannedAt: "2026-07-15T09:00:00.000Z" }).expect(409);
    expect(await db.query.scans.findMany()).toHaveLength(2);
  });

  it("keeps earliest time-in and latest time-out despite delivery order", async () => {
    const { event, student } = await fixture();
    for (const [mode, scannedAt] of [["time_in_am", "2026-07-15T09:00:00.000Z"], ["time_in_am", "2026-07-15T08:00:00.000Z"], ["time_out_am", "2026-07-15T16:00:00.000Z"], ["time_out_am", "2026-07-15T17:00:00.000Z"]] as const) {
      await approve({ scanId: randomUUID(), eventId: event.id, mode, qrPayload: qr(student), scannedAt }).expect(201);
    }
    expect(await db.query.attendanceSessions.findFirst()).toMatchObject({ timeIn: new Date("2026-07-15T08:00:00.000Z"), timeOut: new Date("2026-07-15T17:00:00.000Z") });
    expect(await db.query.penalties.findFirst()).toBeUndefined();
  });

  it("lists only the acting Officer's parsed rejections", async () => {
    const { event, student, officer } = await fixture();
    await request(server()).post("/scan/reject").set("Authorization", bearer).send({ scanId: randomUUID(), eventId: event.id, qrPayload: qr(student), scannedAt: "2026-07-15T08:00:00.000Z" }).expect(201);
    await request(server()).post("/scan/reject").set("Authorization", bearer).send({ scanId: randomUUID(), eventId: event.id, qrPayload: "not-json", scannedAt: "2026-07-15T09:00:00.000Z" }).expect(201);
    const response = await request(server()).post("/scan/rejections").set("Authorization", bearer).send().expect(201);
    expect(response.body.rejections).toEqual(expect.arrayContaining([
      expect.objectContaining({ reason: "Unreadable QR", student: null }),
      expect.objectContaining({ reason: "Rejected by Officer", student: { name: student.name, studentId: student.studentId, program: student.program } }),
    ]));
    expect(response.body.rejections.every((row: { eventName: string }) => row.eventName === "Foundation Day")).toBe(true);
    expect(officer.role).toBe("officer");
  });

  // Known Gap #6 (PR #184): Governor-wide, unlike scan/rejections above.
  it("filters and sorts the Governor-wide rejected-scan log", async () => {
    const { event, student, officer } = await fixture();
    await request(server()).post("/scan/reject").set("Authorization", bearer)
      .send({ scanId: randomUUID(), eventId: event.id, qrPayload: qr(student), scannedAt: "2026-07-15T09:00:00.000Z" }).expect(201);
    await request(server()).post("/scan/reject").set("Authorization", bearer)
      .send({ scanId: randomUUID(), eventId: event.id, qrPayload: "not-json", scannedAt: "2026-07-15T08:00:00.000Z" }).expect(201);

    const [governor] = await db.insert(students).values(
      { email: "governor@example.com", authUserId: "user_governor", name: "Gigi Governor", program: "Computer Science", studentId: "24-003", role: "governor" },
    ).returning();
    verify.mockResolvedValue({ authUserId: governor.authUserId });

    const all = await request(server()).post("/scan/rejections-log").set("Authorization", bearer).send({ sort: "time" }).expect(201);
    expect(all.body.rejections.map((r: { qrPayload: string }) => r.qrPayload)).toEqual([
      qr(student),
      "not-json",
    ]);

    const filtered = await request(server()).post("/scan/rejections-log").set("Authorization", bearer)
      .send({ q: student.studentId }).expect(201);
    expect(filtered.body.rejections).toHaveLength(1);
    expect(filtered.body.rejections[0]).toMatchObject({
      studentName: student.name,
      studentIdText: student.studentId,
      officerName: officer.name,
    });
  });

  it("refuses scan/rejections-log to an Officer", async () => {
    const { officer } = await fixture();
    verify.mockResolvedValue({ authUserId: officer.authUserId });

    await request(server()).post("/scan/rejections-log").set("Authorization", bearer).send({}).expect(403);
  });
});
