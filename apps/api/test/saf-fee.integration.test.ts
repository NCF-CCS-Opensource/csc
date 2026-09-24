import "reflect-metadata";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Reflector } from "@nestjs/core";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { createDb, payments, semesters, students } from "@attendance/db";
import { TOKEN_VERIFIER } from "../src/shared/domain/token-verifier";
import { DB } from "../src/shared/infrastructure/db.module";
import { STUDENT_REPOSITORY } from "../src/modules/student/domain/student-repository";
import { DrizzleStudentRepository } from "../src/modules/student/infrastructure/drizzle-student.repository";
import { AuthGuard } from "../src/shared/presentation/auth.guard";
import { CapabilityGuard } from "../src/shared/presentation/capability.guard";
import { AttendanceUseCase } from "../src/modules/attendance/application/attendance.use-case";
import { DrizzleAttendanceRepository } from "../src/modules/attendance/infrastructure/drizzle-attendance.repository";
import { AttendanceController } from "../src/modules/attendance/presentation/attendance.controller";
import { LEDGER_REPOSITORY } from "../src/modules/ledger/domain/ledger-repository";
import { DrizzleLedgerRepository } from "../src/modules/ledger/infrastructure/drizzle-ledger.repository";
import { LedgerUseCase } from "../src/modules/ledger/application/ledger.use-case";
import { LedgerController } from "../src/modules/ledger/presentation/ledger.controller";
import { SEMESTER_REPOSITORY } from "../src/modules/semester/domain/semester-repository";
import { DrizzleSemesterRepository } from "../src/modules/semester/infrastructure/drizzle-semester.repository";
import { CreateSemesterUseCase } from "../src/modules/semester/application/create-semester.use-case";
import { UpdateSemesterDatesUseCase } from "../src/modules/semester/application/update-semester-dates.use-case";
import { CloseSemesterUseCase } from "../src/modules/semester/application/close-semester.use-case";
import { GetOpenSemesterUseCase } from "../src/modules/semester/application/get-open-semester.use-case";
import { ListSemestersUseCase } from "../src/modules/semester/application/list-semesters.use-case";
import { DeleteSemesterUseCase } from "../src/modules/semester/application/delete-semester.use-case";
import { SemesterController } from "../src/modules/semester/presentation/semester.controller";
import { createTestApp } from "./create-test-app";

const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString) throw new Error("TEST_DATABASE_URL is required");
if (!["127.0.0.1", "localhost", "[::1]"].includes(new URL(connectionString).hostname)) {
  throw new Error("Integration tests only run against disposable local Postgres");
}
const db = createDb(connectionString);

describe("SAF Fee Payments (e2e)", () => {
  let app: INestApplication;
  const verify = vi.fn();

  beforeAll(async () => {
    app = await createTestApp(
      [AttendanceController, LedgerController, SemesterController],
      [
        { provide: DB, useValue: db },
        { provide: TOKEN_VERIFIER, useValue: { verify } },
        { provide: STUDENT_REPOSITORY, useClass: DrizzleStudentRepository },
        { provide: LEDGER_REPOSITORY, useClass: DrizzleLedgerRepository },
        { provide: SEMESTER_REPOSITORY, useClass: DrizzleSemesterRepository },
        AttendanceUseCase,
        DrizzleAttendanceRepository,
        LedgerUseCase,
        CreateSemesterUseCase,
        UpdateSemesterDatesUseCase,
        CloseSemesterUseCase,
        GetOpenSemesterUseCase,
        ListSemestersUseCase,
        DeleteSemesterUseCase,
        AuthGuard,
        CapabilityGuard,
        Reflector,
      ],
    );
  });

  afterAll(async () => app.close());
  const clear = async () => {
    await db.delete(payments);
    await db.delete(semesters);
    await db.delete(students);
  };
  beforeEach(async () => { verify.mockReset(); await clear(); });
  afterEach(clear);

  async function fixture({ role = "governor" as "governor" | "student", closed = false, safFeeAmount = "500.00" as string | null } = {}) {
    const [semester] = await db.insert(semesters).values({ startDate: "2026-01-01", endDate: "2026-12-31", closedAt: closed ? new Date() : null, safFeeAmount }).returning();
    const [student, actor] = await db.insert(students).values([
      { email: "student@example.com", authUserId: "student", name: "Grace Hopper", program: "Computer Science", studentId: "24-001", createdAt: new Date("2026-06-01T00:00:00Z") },
      { email: "actor@example.com", authUserId: "actor", name: "Ada Lovelace", program: "Computer Science", studentId: "24-002", role },
    ]).returning();
    verify.mockResolvedValue({ authUserId: actor.authUserId });
    return { semester, student, actor };
  }

  const post = (path: string, body: Record<string, unknown>) => request(app.getHttpServer()).post(path).set("Authorization", "Bearer token").send(body);
  const pay = (studentId: string, semesterId: string) => post("/attendance/payments/saf", { studentId, semesterId });
  const ledger = async (semesterId: string, studentId: string) => (await post("/ledger/student", { semesterId, studentId }).expect(201)).body;

  it.each([["open", false], ["closed", true]])("records, rejects a duplicate, voids, and pays again in a %s Semester", async (_label, closed) => {
    const { semester, student, actor } = await fixture({ closed });
    // A Semester with no Events still charges its SAF Fee, and a Student who
    // registered mid-Semester owes the full amount.
    expect(await ledger(semester.id, student.id)).toMatchObject({ total: 500, outstanding: 500, saf: { amount: 500, paid: false, paymentId: null } });

    await pay(student.id, semester.id).expect(201);
    const [payment] = await db.select().from(payments);
    expect(payment).toMatchObject({ studentId: student.id, semesterId: semester.id, penaltyId: null, amount: "500.00", officerId: actor.id, voidedAt: null });
    expect(await ledger(semester.id, student.id)).toMatchObject({ outstanding: 0, saf: { paid: true, paymentId: payment.id } });

    await pay(student.id, semester.id).expect(409);
    expect(await db.select().from(payments)).toHaveLength(1);

    await post("/attendance/payments/void", { paymentId: payment.id }).expect(201);
    expect(await ledger(semester.id, student.id)).toMatchObject({ outstanding: 500, saf: { paid: false, paymentId: null } });

    await pay(student.id, semester.id).expect(201);
    expect(await ledger(semester.id, student.id)).toMatchObject({ outstanding: 0, saf: { paid: true } });
    expect((await db.select().from(payments)).filter((row) => !row.voidedAt)).toHaveLength(1);
  });

  it("returns 400 when the Semester has no SAF Fee amount", async () => {
    const { semester, student } = await fixture({ closed: true, safFeeAmount: null });
    await pay(student.id, semester.id).expect(400);
    expect(await ledger(semester.id, student.id)).toMatchObject({ total: 0, saf: null });
  });

  it("returns 404 for an unknown Student or Semester and 400 for a malformed body", async () => {
    const { semester, student } = await fixture();
    await pay("00000000-0000-0000-0000-000000000000", semester.id).expect(404);
    await pay(student.id, "00000000-0000-0000-0000-000000000000").expect(404);
    await post("/attendance/payments/saf", { studentId: student.id }).expect(400);
  });

  it("refuses an Officer paying their own SAF Fee (TM-2)", async () => {
    const { semester, actor } = await fixture();
    await pay(actor.id, semester.id).expect(403);
    expect(await db.select().from(payments)).toHaveLength(0);
  });

  it("refuses a non-Officer recording or voiding with 403", async () => {
    const { semester, student, actor } = await fixture({ role: "student" });
    await pay(student.id, semester.id).expect(403);
    const [payment] = await db.insert(payments).values({ studentId: student.id, semesterId: semester.id, amount: "500.00", officerId: actor.id }).returning();
    await post("/attendance/payments/void", { paymentId: payment.id }).expect(403);
    expect(await db.select().from(payments)).toMatchObject([{ voidedAt: null }]);
  });

  it("locks the SAF Fee amount while an un-voided SAF Fee Payment exists", async () => {
    const { semester, student } = await fixture();
    const edit = (safFeeAmount: string) => post("/semester/update", { id: semester.id, startDate: "2026-01-01", endDate: "2026-12-31", safFeeAmount });
    await edit("400").expect(201);

    await pay(student.id, semester.id).expect(201);
    expect(await db.select().from(payments)).toMatchObject([{ amount: "400.00" }]);
    await edit("600").expect(409);
    // Re-saving the same amount (e.g. a dates-only edit) is still allowed.
    await edit("400.00").expect(201);

    const [payment] = await db.select().from(payments);
    await post("/attendance/payments/void", { paymentId: payment.id }).expect(201);
    await edit("600").expect(201);
  });
});
