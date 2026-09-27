import { Inject, Injectable } from "@nestjs/common";
import type { ExpenseListItem, RecordExpenseRequest } from "@attendance/contracts";
import { EXPENSE_REPOSITORY, type ExpenseRepository } from "../domain/expense-repository";

// Recording and voiding an Expense from /finance (issue #347). A thin
// pass-through like AttendanceUseCase: the open-Semester lookup, the void
// stamping and the audit rules all live in the repository transaction, so this
// layer only carries the recording/voiding Officer through.
@Injectable()
export class ExpenseUseCase {
  constructor(@Inject(EXPENSE_REPOSITORY) private readonly expenses: ExpenseRepository) {}

  record(input: RecordExpenseRequest, officerId: string): Promise<void> {
    return this.expenses.record(input, officerId);
  }

  voidExpense(expenseId: string, officerId: string): Promise<void> {
    return this.expenses.voidExpense(expenseId, officerId);
  }

  list(): Promise<ExpenseListItem[]> {
    return this.expenses.listOpenSemesterExpenses();
  }
}
