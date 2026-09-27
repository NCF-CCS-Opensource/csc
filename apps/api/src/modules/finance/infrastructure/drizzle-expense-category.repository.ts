import { Inject, Injectable } from "@nestjs/common";
import { asc, eq } from "drizzle-orm";
import { expenseCategories, type Database } from "@attendance/db";
import type { ExpenseCategory } from "@attendance/contracts";
import { DB } from "../../../shared/infrastructure/db.module";
import {
  DuplicateExpenseCategoryError,
  ExpenseCategoryInUseError,
  ExpenseCategoryNotFoundError,
  type ExpenseCategoryRepository,
} from "../domain/expense-category-repository";

@Injectable()
export class DrizzleExpenseCategoryRepository implements ExpenseCategoryRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

  async listNames(): Promise<string[]> {
    const rows = await this.db
      .select({ name: expenseCategories.name })
      .from(expenseCategories)
      .orderBy(asc(expenseCategories.name));
    return rows.map((row) => row.name);
  }

  async listAll(): Promise<ExpenseCategory[]> {
    return this.db
      .select({ id: expenseCategories.id, name: expenseCategories.name })
      .from(expenseCategories)
      .orderBy(asc(expenseCategories.name));
  }

  async create(name: string): Promise<ExpenseCategory> {
    try {
      const [row] = await this.db.insert(expenseCategories).values({ name }).returning();
      return row!;
    } catch (error) {
      if ((error as { code?: string }).code === "23505") throw new DuplicateExpenseCategoryError();
      throw error;
    }
  }

  async rename(id: string, name: string): Promise<ExpenseCategory> {
    let row: ExpenseCategory | undefined;
    try {
      [row] = await this.db
        .update(expenseCategories)
        .set({ name })
        .where(eq(expenseCategories.id, id))
        .returning();
    } catch (error) {
      if ((error as { code?: string }).code === "23505") throw new DuplicateExpenseCategoryError();
      throw error;
    }
    if (!row) throw new ExpenseCategoryNotFoundError();
    return row;
  }

  async delete(id: string): Promise<void> {
    try {
      await this.db.delete(expenseCategories).where(eq(expenseCategories.id, id));
    } catch (error) {
      if ((error as { code?: string }).code === "23503") throw new ExpenseCategoryInUseError();
      throw error;
    }
  }
}
