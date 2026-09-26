// Recording and voiding an Expense from /finance (issue #347) — the Department
// Fund's money-out, mirroring the Payment record/void discipline. An Expense
// attaches to the open Semester and the recording Officer; it is insert-only
// except the one void update, which stamps voidedAt/voidedBy and keeps the row.

// amount is a decimal string ("120.00"); incurredOn is an ISO date
// ("2026-09-26"), defaulting to today at the form but backdatable.
export interface RecordExpenseRequest {
  amount: string;
  description: string;
  incurredOn: string;
  category: string;
}

export interface VoidExpenseRequest {
  expenseId: string;
}

// One Expense row for the /finance list. Voided rows stay visible: voidedAt is
// set and voidedBy carries the voiding Officer's name (null while un-voided).
export interface ExpenseListItem {
  id: string;
  category: string;
  amount: string;
  description: string;
  incurredOn: string;
  recordedBy: string;
  voidedAt: string | null;
  voidedBy: string | null;
}

// The open Semester's Expenses, newest first; empty when no Semester is open.
export interface ExpenseListResponse {
  expenses: ExpenseListItem[];
}
