// The Governor-managed Expense Category vocabulary every Expense is classified
// by (issue #345). Mirrors Program: a unique name, referenced by name.
export interface ExpenseCategory {
  id: string;
  name: string;
}

export interface CreateExpenseCategoryRequest {
  name: string;
}

export interface RenameExpenseCategoryRequest {
  id: string;
  name: string;
}

export interface DeleteExpenseCategoryRequest {
  id: string;
}

// expense-category/list returns names only (enough for the record-Expense
// picker); expense-category/list-detailed carries the id the admin
// rename/remove forms need.
export interface ExpenseCategoryListResponse {
  categories: string[];
}

export interface ExpenseCategoryListDetailedResponse {
  categories: ExpenseCategory[];
}
