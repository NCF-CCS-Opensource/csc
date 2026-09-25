import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { createDb } from "../src/client";
import { expenseCategories, payments, programs, semesters, students } from "../src/schema";

const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString) throw new Error("TEST_DATABASE_URL is required");

const host = new URL(connectionString).hostname;
if (!["127.0.0.1", "localhost", "[::1]"].includes(host)) {
  throw new Error("Integration tests only run against disposable local Postgres");
}

const db = createDb(connectionString);

describe("disposable Postgres", () => {
  it("rolls back a failed Drizzle transaction", async () => {
    const name = `rollback-${randomUUID()}`;

    await expect(
      db.transaction(async (transaction) => {
        await transaction.insert(programs).values({ name });
        throw new Error("forced rollback");
      }),
    ).rejects.toThrow("forced rollback");

    expect(
      await db.query.programs.findFirst({ where: eq(programs.name, name) }),
    ).toBeUndefined();
  });

  it("seeds the default Expense Categories at migration time (issue #345)", async () => {
    const names = (await db.select({ name: expenseCategories.name }).from(expenseCategories)).map(
      (row) => row.name,
    );
    expect(names).toEqual(expect.arrayContaining(["Supplies", "Food", "Honoraria", "Transportation"]));
  });

  it("enforces schema constraints through Drizzle", async () => {
    const name = `unique-${randomUUID()}`;
    await db.insert(programs).values({ name });

    await expect(db.insert(programs).values({ name })).rejects.toMatchObject({
      code: "23505",
    });
  });

  it("stores a non-uuid auth identifier and rejects a duplicate", async () => {
    const suffix = randomUUID();
    const row = {
      authUserId: `user_${suffix}`,
      email: `${suffix}@gbox.ncf.edu.ph`,
      name: "Test Student",
      program: "Computer Science",
      studentId: suffix,
    };
    await db.insert(students).values(row);

    await expect(
      db.insert(students).values({
        ...row,
        email: `dup-${suffix}@gbox.ncf.edu.ph`,
        studentId: `dup-${suffix}`,
      }),
    ).rejects.toMatchObject({ code: "23505" });
  });

  it("allows only one open Semester", async () => {
    await db.insert(semesters).values({
      startDate: "2026-01-01",
      endDate: "2026-05-31",
    });

    await expect(
      db.insert(semesters).values({
        startDate: "2026-06-01",
        endDate: "2026-10-31",
      }),
    ).rejects.toMatchObject({ code: "23505" });
  });

  // Replays the real migration file inside a rolled-back transaction, against
  // a table that looks like it did just before the migration shipped.
  it("gives only the open Semester a ₱500 SAF Fee at rollout (ADR 0024)", async () => {
    const migration = readFileSync(
      new URL("../migrations/0010_long_nextwave.sql", import.meta.url),
      "utf8",
    );
    const rollback = new Error("rollback");

    await expect(
      db.transaction(async (transaction) => {
        await transaction.execute(sql`truncate semesters cascade`);
        await transaction.execute(sql`alter table semesters drop column saf_fee_amount`);
        await transaction.execute(sql`
          insert into semesters (start_date, end_date, closed_at) values
            ('2025-06-01', '2025-10-31', now()),
            ('2026-01-01', '2026-05-31', null)`);

        for (const statement of migration.split("--> statement-breakpoint")) {
          await transaction.execute(sql.raw(statement));
        }

        const rows = await transaction.execute<{ closed: boolean; saf_fee_amount: string | null }>(
          sql`select closed_at is not null as closed, saf_fee_amount from semesters order by start_date`,
        );
        expect(rows.map((row) => ({ ...row }))).toEqual([
          { closed: true, saf_fee_amount: null },
          { closed: false, saf_fee_amount: "500.00" },
        ]);
        throw rollback;
      }),
    ).rejects.toBe(rollback);
  });
  it("makes a Payment target exactly one Penalty or one (Student, Semester) SAF Fee, unpaid at most once", async () => {
    const rollback = new Error("rollback");
    await expect(
      db.transaction(async (transaction) => {
        const suffix = randomUUID();
        const [student] = await transaction.insert(students).values({ authUserId: `user_${suffix}`, email: `${suffix}@gbox.ncf.edu.ph`, name: "Test Student", program: "Computer Science", studentId: suffix }).returning();
        const [semester] = await transaction.insert(semesters).values({ startDate: "2020-01-01", endDate: "2020-05-31", closedAt: new Date(), safFeeAmount: "500" }).returning();
        const saf = { studentId: student.id, semesterId: semester.id, amount: "500", officerId: student.id };

        const violation = (values: typeof payments.$inferInsert) =>
          transaction.transaction(async (savepoint) => { await savepoint.insert(payments).values(values); }).then(() => "inserted", (error) => error.code);
        expect(await violation({ amount: "500", officerId: student.id })).toBe("23514");
        expect(await violation({ ...saf, semesterId: null })).toBe("23514");
        expect(await violation({ ...saf, penaltyId: randomUUID() })).toBe("23514");

        const [first] = await transaction.insert(payments).values(saf).returning();
        expect(await violation(saf)).toBe("23505");
        await transaction.update(payments).set({ voidedAt: new Date() }).where(eq(payments.id, first.id));
        expect(await violation(saf)).toBe("inserted");
        throw rollback;
      }),
    ).rejects.toBe(rollback);
  });
});
