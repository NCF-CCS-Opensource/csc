import { HttpException, Inject, Injectable } from "@nestjs/common";
import { and, desc, eq, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { expenses, semesters, students, type Database } from "@attendance/db";
import type { ExpenseListItem } from "@attendance/contracts";
import { DB } from "../../../shared/infrastructure/db.module";
import type { ExpenseRepository } from "../domain/expense-repository";

@Injectable()
export class DrizzleExpenseRepository implements ExpenseRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

  async listForFund(): Promise<{ amount: string; voidedAt: Date | null }[]> {
    return this.db
      .select({ amount: expenses.amount, voidedAt: expenses.voidedAt })
      .from(expenses);
  }

  async record(
    input: { category: string; amount: string; description: string; incurredOn: string },
    officerId: string,
  ): Promise<void> {
    await this.db.transaction(async (transaction) => {
      // Lock the open Semester for the insert's lifetime, matching Event create:
      // a Semester can't close out from under a recording Officer mid-insert.
      const [open] = await transaction
        .select({ id: semesters.id })
        .from(semesters)
        .where(isNull(semesters.closedAt))
        .limit(1)
        .for("update");
      if (!open) {
        throw new HttpException("No open Semester — spending is only recorded while one is open", 409);
      }
      try {
        await transaction.insert(expenses).values({
          semesterId: open.id,
          category: input.category,
          amount: input.amount,
          description: input.description,
          incurredOn: input.incurredOn,
          officerId,
        });
      } catch (error) {
        // FK on category → the picked Category no longer exists.
        if ((error as { code?: string }).code === "23503") throw new HttpException("Unknown Expense Category", 400);
        throw error;
      }
    });
  }

  async voidExpense(expenseId: string, officerId: string): Promise<void> {
    const [voided] = await this.db
      .update(expenses)
      .set({ voidedAt: new Date(), voidedBy: officerId })
      .where(and(eq(expenses.id, expenseId), isNull(expenses.voidedAt)))
      .returning({ id: expenses.id });
    if (voided) return;
    if (await this.db.query.expenses.findFirst({ where: eq(expenses.id, expenseId) })) {
      throw new HttpException("Expense is already voided", 409);
    }
    throw new HttpException("Expense not found", 404);
  }

  async listOpenSemesterExpenses(): Promise<ExpenseListItem[]> {
    const [open] = await this.db
      .select({ id: semesters.id })
      .from(semesters)
      .where(isNull(semesters.closedAt))
      .limit(1);
    if (!open) return [];

    const voider = alias(students, "voider");
    const rows = await this.db
      .select({
        id: expenses.id,
        category: expenses.category,
        amount: expenses.amount,
        description: expenses.description,
        incurredOn: expenses.incurredOn,
        recordedBy: students.name,
        voidedAt: expenses.voidedAt,
        voidedBy: voider.name,
      })
      .from(expenses)
      .innerJoin(students, eq(expenses.officerId, students.id))
      .leftJoin(voider, eq(expenses.voidedBy, voider.id))
      .where(eq(expenses.semesterId, open.id))
      .orderBy(desc(expenses.createdAt));

    return rows.map((row) => ({
      ...row,
      voidedAt: row.voidedAt ? row.voidedAt.toISOString() : null,
    }));
  }
}
