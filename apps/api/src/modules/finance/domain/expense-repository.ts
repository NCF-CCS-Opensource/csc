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
}

export const EXPENSE_REPOSITORY = Symbol("ExpenseRepository");
