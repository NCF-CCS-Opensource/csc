import { Inject, Injectable } from "@nestjs/common";
import { expenses, type Database } from "@attendance/db";
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
}
