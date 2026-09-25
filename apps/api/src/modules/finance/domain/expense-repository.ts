// A repository interface, satisfied by infrastructure/. Hides Drizzle and the
// expenses table shape from the use case, matching the seam used elsewhere
// (domain interface + DI token, Drizzle implementation).
export interface ExpenseRepository {
  // Every Expense across all Semesters, projected to what the Department Fund
  // needs. Voided rows are kept in and excluded by computeDepartmentFund, so
  // the void rule lives in one place (the domain) rather than the query.
  listForFund(): Promise<{ amount: string; voidedAt: Date | null }[]>;
}

export const EXPENSE_REPOSITORY = Symbol("ExpenseRepository");
