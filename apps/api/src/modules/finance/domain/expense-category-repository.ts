import type { ExpenseCategory } from "@attendance/contracts";

// A repository interface, satisfied by infrastructure/ (ADR-0017). Mirrors
// ProgramRepository — the Expense Category vocabulary is Governor-managed the
// same way the Program list is.
export interface ExpenseCategoryRepository {
  listNames(): Promise<string[]>;
  // Same rows as listNames, with the id the admin rename/remove forms need.
  listAll(): Promise<ExpenseCategory[]>;
  // Throws DuplicateExpenseCategoryError on a name collision.
  create(name: string): Promise<ExpenseCategory>;
  // Throws DuplicateExpenseCategoryError on a name collision and
  // ExpenseCategoryNotFoundError when no Category has that id.
  rename(id: string, name: string): Promise<ExpenseCategory>;
  // Throws ExpenseCategoryInUseError when an Expense still references it.
  delete(id: string): Promise<void>;
}

export const EXPENSE_CATEGORY_REPOSITORY = Symbol("ExpenseCategoryRepository");

export class DuplicateExpenseCategoryError extends Error {
  constructor() {
    super("That Expense Category already exists");
  }
}

export class ExpenseCategoryNotFoundError extends Error {
  constructor() {
    super("That Expense Category no longer exists");
  }
}

export class ExpenseCategoryInUseError extends Error {
  constructor() {
    super("Can't remove an Expense Category that Expenses are recorded under");
  }
}
