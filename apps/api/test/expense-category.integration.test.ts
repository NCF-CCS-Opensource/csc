import "reflect-metadata";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Reflector } from "@nestjs/core";
import type { INestApplication } from "@nestjs/common";
import { sql } from "drizzle-orm";
import request from "supertest";
import { createDb, expenseCategories, students } from "@attendance/db";
import { TOKEN_VERIFIER } from "../src/shared/domain/token-verifier";
import { DB } from "../src/shared/infrastructure/db.module";
import { STUDENT_REPOSITORY } from "../src/modules/student/domain/student-repository";
import { DrizzleStudentRepository } from "../src/modules/student/infrastructure/drizzle-student.repository";
import { AuthGuard } from "../src/shared/presentation/auth.guard";
import { CapabilityGuard } from "../src/shared/presentation/capability.guard";
import { EXPENSE_CATEGORY_REPOSITORY } from "../src/modules/finance/domain/expense-category-repository";
import { DrizzleExpenseCategoryRepository } from "../src/modules/finance/infrastructure/drizzle-expense-category.repository";
import {
  CreateExpenseCategoryUseCase,
  DeleteExpenseCategoryUseCase,
  ListExpenseCategoriesDetailedUseCase,
  ListExpenseCategoriesUseCase,
  RenameExpenseCategoryUseCase,
} from "../src/modules/finance/application/expense-category.use-cases";
import { ExpenseCategoryController } from "../src/modules/finance/presentation/expense-category.controller";
import { createTestApp } from "./create-test-app";

const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString) throw new Error("TEST_DATABASE_URL is required");
if (!["127.0.0.1", "localhost", "[::1]"].includes(new URL(connectionString).hostname)) {
  throw new Error("Integration tests only run against disposable local Postgres");
}
const db = createDb(connectionString);

// Stands in for the future expenses table (#346), whose `category` FK is what
// makes an in-use Category un-deletable. A real FK reference here proves the
// repository's 23503 -> 409 mapping end to end without pulling that ticket
// forward.
const REF_PROBE = "expense_category_ref_probe";

describe("Expense Categories (e2e)", () => {
  let app: INestApplication;
  const verify = vi.fn();

  beforeAll(async () => {
    await db.execute(
      sql.raw(
        `create table if not exists ${REF_PROBE} (category text references expense_categories(name))`,
      ),
    );
    app = await createTestApp(
      [ExpenseCategoryController],
      [
        { provide: DB, useValue: db },
        { provide: TOKEN_VERIFIER, useValue: { verify } },
        { provide: STUDENT_REPOSITORY, useClass: DrizzleStudentRepository },
        { provide: EXPENSE_CATEGORY_REPOSITORY, useClass: DrizzleExpenseCategoryRepository },
        ListExpenseCategoriesUseCase,
        ListExpenseCategoriesDetailedUseCase,
        CreateExpenseCategoryUseCase,
        RenameExpenseCategoryUseCase,
        DeleteExpenseCategoryUseCase,
        AuthGuard,
        CapabilityGuard,
        Reflector,
      ],
    );
  });

  afterAll(async () => {
    await db.execute(sql.raw(`drop table if exists ${REF_PROBE}`));
    await app.close();
  });

  const clear = async () => {
    await db.execute(sql.raw(`delete from ${REF_PROBE}`));
    await db.delete(expenseCategories);
    await db.delete(students);
  };
  beforeEach(async () => {
    verify.mockReset();
    await clear();
  });
  afterEach(clear);

  async function actAs(role: "governor" | "officer" | "student") {
    const [actor] = await db
      .insert(students)
      .values({
        email: "actor@example.com",
        authUserId: "actor",
        name: "Ada Lovelace",
        program: "Computer Science",
        studentId: "24-002",
        role,
      })
      .returning();
    verify.mockResolvedValue({ authUserId: actor.authUserId });
    return actor;
  }

  const post = (path: string, body: Record<string, unknown> = {}) =>
    request(app.getHttpServer()).post(path).set("Authorization", "Bearer token").send(body);
  const list = async () => (await post("/expense-category/list").expect(201)).body.categories;
  const listDetailed = async () =>
    (await post("/expense-category/list-detailed").expect(201)).body.categories;

  it("creates, lists, renames, and removes a Category (Governor)", async () => {
    await actAs("governor");

    const created = (await post("/expense-category/create", { name: " Venue " }).expect(201)).body;
    expect(created).toMatchObject({ name: "Venue" });
    expect(created.id).toBeTruthy();
    expect(await list()).toEqual(["Venue"]);

    // list-detailed carries the id the admin forms need.
    expect(await listDetailed()).toEqual([{ id: created.id, name: "Venue" }]);

    const renamed = (
      await post("/expense-category/rename", { id: created.id, name: "Venue rental" }).expect(201)
    ).body;
    expect(renamed).toMatchObject({ id: created.id, name: "Venue rental" });
    expect(await list()).toEqual(["Venue rental"]);

    await post("/expense-category/delete", { id: created.id }).expect(201);
    expect(await list()).toEqual([]);
  });

  it("rejects a duplicate name on create and rename with 409", async () => {
    await actAs("governor");
    const [{ id: suppliesId }] = await db
      .insert(expenseCategories)
      .values([{ name: "Supplies" }, { name: "Food" }])
      .returning();

    await post("/expense-category/create", { name: "Supplies" }).expect(409);
    // Renaming Supplies onto the existing Food name collides too.
    await post("/expense-category/rename", { id: suppliesId, name: "Food" }).expect(409);
    expect(await list()).toEqual(["Food", "Supplies"]);
  });

  it("returns 404 renaming a Category that does not exist", async () => {
    await actAs("governor");
    await post("/expense-category/rename", {
      id: "00000000-0000-0000-0000-000000000000",
      name: "Nope",
    }).expect(404);
  });

  it("refuses removing a Category an Expense references, leaving it in place (409)", async () => {
    await actAs("governor");
    const [category] = await db.insert(expenseCategories).values({ name: "Food" }).returning();
    await db.execute(sql.raw(`insert into ${REF_PROBE} (category) values ('${category.name}')`));

    await post("/expense-category/delete", { id: category.id }).expect(409);
    expect(await list()).toEqual(["Food"]);
  });

  it("lets any Officer list Categories for the record-Expense picker", async () => {
    await actAs("officer");
    await db.insert(expenseCategories).values({ name: "Supplies" });
    expect(await list()).toEqual(["Supplies"]);
  });

  it.each(["officer", "student"] as const)(
    "refuses a %s mutating Categories with 403, leaving the list untouched",
    async (role) => {
      await actAs(role);
      const [category] = await db.insert(expenseCategories).values({ name: "Food" }).returning();

      await post("/expense-category/create", { name: "Supplies" }).expect(403);
      await post("/expense-category/rename", { id: category.id, name: "Meals" }).expect(403);
      await post("/expense-category/delete", { id: category.id }).expect(403);
      await post("/expense-category/list-detailed").expect(403);

      expect(await db.select().from(expenseCategories)).toMatchObject([{ name: "Food" }]);
    },
  );

  it("refuses a Student listing Categories with 403 (manage_operations required)", async () => {
    await actAs("student");
    await post("/expense-category/list").expect(403);
  });
});
