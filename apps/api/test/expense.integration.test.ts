import "reflect-metadata";
import { afterAll, afterEach, beforeEach, beforeAll, describe, expect, it, vi } from "vitest";
import { Reflector } from "@nestjs/core";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { createDb, expenseCategories, expenses, semesters, students } from "@attendance/db";
import { TOKEN_VERIFIER } from "../src/shared/domain/token-verifier";
import { DB } from "../src/shared/infrastructure/db.module";
import { STUDENT_REPOSITORY } from "../src/modules/student/domain/student-repository";
import { DrizzleStudentRepository } from "../src/modules/student/infrastructure/drizzle-student.repository";
import { AuthGuard } from "../src/shared/presentation/auth.guard";
import { CapabilityGuard } from "../src/shared/presentation/capability.guard";
import { EXPENSE_REPOSITORY } from "../src/modules/finance/domain/expense-repository";
import { DrizzleExpenseRepository } from "../src/modules/finance/infrastructure/drizzle-expense.repository";
import { ExpenseUseCase } from "../src/modules/finance/application/expense.use-case";
import { ExpenseController } from "../src/modules/finance/presentation/expense.controller";
import { DepartmentFundUseCase } from "../src/modules/finance/application/department-fund.use-case";
import { FinanceController } from "../src/modules/finance/presentation/finance.controller";
import { REPORT_REPOSITORY } from "../src/modules/report/domain/report-repository";
import { DrizzleReportRepository } from "../src/modules/report/infrastructure/drizzle-report.repository";
import { SEMESTER_REPOSITORY } from "../src/modules/semester/domain/semester-repository";
import { DrizzleSemesterRepository } from "../src/modules/semester/infrastructure/drizzle-semester.repository";
import { createTestApp } from "./create-test-app";

const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString) throw new Error("TEST_DATABASE_URL is required");
if (!["127.0.0.1", "localhost", "[::1]"].includes(new URL(connectionString).hostname)) {
  throw new Error("Integration tests only run against disposable local Postgres");
}
const db = createDb(connectionString);

describe("Expenses (e2e)", () => {
  let app: INestApplication;
  const verify = vi.fn();

  beforeAll(async () => {
    app = await createTestApp(
      [ExpenseController, FinanceController],
      [
        { provide: DB, useValue: db },
        { provide: TOKEN_VERIFIER, useValue: { verify } },
        { provide: STUDENT_REPOSITORY, useClass: DrizzleStudentRepository },
        { provide: EXPENSE_REPOSITORY, useClass: DrizzleExpenseRepository },
        { provide: REPORT_REPOSITORY, useClass: DrizzleReportRepository },
        { provide: SEMESTER_REPOSITORY, useClass: DrizzleSemesterRepository },
        ExpenseUseCase,
        DepartmentFundUseCase,
        AuthGuard,
        CapabilityGuard,
        Reflector,
      ],
    );
  });

  afterAll(async () => app.close());
  const clear = async () => {
    await db.delete(expenses);
    await db.delete(expenseCategories);
    await db.delete(semesters);
    await db.delete(students);
  };
  beforeEach(async () => { verify.mockReset(); await clear(); });
  afterEach(clear);

  async function fixture({ role = "governor" as "governor" | "student", closed = false } = {}) {
    const [semester] = await db.insert(semesters).values({ startDate: "2026-01-01", endDate: "2026-12-31", closedAt: closed ? new Date() : null }).returning();
    const [actor] = await db.insert(students).values([
      { email: "actor@example.com", authUserId: "actor", name: "Ada Lovelace", program: "Computer Science", studentId: "24-002", role },
    ]).returning();
    await db.insert(expenseCategories).values({ name: "Supplies" });
    verify.mockResolvedValue({ authUserId: actor.authUserId });
    return { semester, actor };
  }

  const post = (path: string, body: Record<string, unknown>) => request(app.getHttpServer()).post(path).set("Authorization", "Bearer token").send(body);
  const record = (body: Record<string, unknown> = { amount: "120.00", description: "Printer ink", incurredOn: "2026-03-01", category: "Supplies" }) => post("/expense/record", body);
  const summary = async () => (await post("/finance/summary", {}).expect(201)).body;
  const list = async () => (await post("/expense/list", {}).expect(201)).body.expenses;

  it("records against the open Semester — lowers the Fund, shows in the list — then voids, restoring the balance and stamping audit fields", async () => {
    const { actor } = await fixture();
    const before = await summary();

    await record().expect(201);

    const afterRecord = await summary();
    expect(afterRecord.totalExpenses).toBe(before.totalExpenses + 120);
    expect(afterRecord.balance).toBe(before.balance - 120);

    const listed = await list();
    expect(listed).toHaveLength(1);
    expect(listed[0]).toMatchObject({ category: "Supplies", amount: "120.00", description: "Printer ink", incurredOn: "2026-03-01", recordedBy: "Ada Lovelace", voidedAt: null, voidedBy: null });

    await post("/expense/void", { expenseId: listed[0].id }).expect(201);

    const afterVoid = await summary();
    expect(afterVoid.totalExpenses).toBe(before.totalExpenses);
    expect(afterVoid.balance).toBe(before.balance);

    // The row stays visible as voided — never deleted — stamped with who/when.
    const [row] = await db.select().from(expenses);
    expect(row).toMatchObject({ voidedBy: actor.id });
    expect(row.voidedAt).toBeInstanceOf(Date);
    const voidedListed = await list();
    expect(voidedListed).toMatchObject([{ id: listed[0].id, voidedAt: expect.any(String), voidedBy: "Ada Lovelace" }]);
  });

  it("refuses recording when no Semester is open, and lists nothing", async () => {
    await fixture({ closed: true });
    await record().expect(409);
    expect(await db.select().from(expenses)).toHaveLength(0);
    expect(await list()).toEqual([]);
  });

  it("returns 409 voiding an already-voided Expense and 404 for an unknown one", async () => {
    await fixture();
    await record().expect(201);
    const [row] = await db.select().from(expenses);
    await post("/expense/void", { expenseId: row.id }).expect(201);
    await post("/expense/void", { expenseId: row.id }).expect(409);
    await post("/expense/void", { expenseId: "00000000-0000-0000-0000-000000000000" }).expect(404);
  });

  it("rejects a malformed body and an unknown Category", async () => {
    await fixture();
    await record({ description: "no amount", incurredOn: "2026-03-01", category: "Supplies" }).expect(400);
    await record({ amount: "0", description: "zero", incurredOn: "2026-03-01", category: "Supplies" }).expect(400);
    await record({ amount: "10.00", description: "bad cat", incurredOn: "2026-03-01", category: "Nonexistent" }).expect(400);
    expect(await db.select().from(expenses)).toHaveLength(0);
  });

  it("refuses a non-Officer recording, voiding, or listing with 403", async () => {
    const { actor, semester } = await fixture({ role: "student" });
    await record().expect(403);
    const [row] = await db.insert(expenses).values({ semesterId: semester.id, category: "Supplies", amount: "50.00", description: "seed", incurredOn: "2026-03-01", officerId: actor.id }).returning();
    await post("/expense/void", { expenseId: row.id }).expect(403);
    await post("/expense/list", {}).expect(403);
    expect(await db.select().from(expenses)).toMatchObject([{ voidedAt: null }]);
  });
});
