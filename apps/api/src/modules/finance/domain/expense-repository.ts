import type { ExpenseListItem, RecordExpenseRequest } from "@attendance/contracts";

// A repository interface, satisfied by infrastructure/. Hides Drizzle and the
// expenses table shape from the use case, matching the seam used elsewhere
// (domain interface + DI token, Drizzle implementation).
export interface ExpenseRepository {
  // Every Expense across all Semesters, projected to what the Department Fund
  // needs. Voided rows are kept in; computeDepartmentFund excludes them, so the
  // Expense (money-out) void rule sits in the domain rather than the query.
  // (Money-in void exclusion lives upstream in computeFinancialReport, which the
  // Fund reuses — the two streams filter voids in their own layers.)
  listForFund(): Promise<{ amount: string; voidedAt: Date | null }[]>;

  // Records against the open Semester in one transaction (open-Semester lookup
  // + insert), mirroring the Event create discipline; throws HttpException(409)
  // when no Semester is open, so spending is only recorded while one is (#347).
  record(input: RecordExpenseRequest, officerId: string): Promise<void>;

  // Stamps voidedAt/voidedBy and keeps the row; never edits or deletes. Throws
  // HttpException(404) for an unknown id, 409 when already voided.
  voidExpense(expenseId: string, officerId: string): Promise<void>;

  // The open Semester's Expenses, newest first, with Officer names resolved;
  // empty when no Semester is open.
  listOpenSemesterExpenses(): Promise<ExpenseListItem[]>;
}

export const EXPENSE_REPOSITORY = Symbol("ExpenseRepository");
