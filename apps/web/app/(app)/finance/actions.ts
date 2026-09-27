"use server";

import type {
  DepartmentFundSummary,
  ExpenseListItem,
  ExpenseListResponse,
  ExpenseCategoryListResponse,
  RecordExpenseRequest,
} from "@attendance/contracts";
import { requireCapability } from "@/lib/auth";
import { ApiError, apiPost } from "@/lib/api-client";

// The Department Fund's one read (issue #346), called by the server shell for
// the first paint and by the client cache's queryFn on every revisit (ADR 0013).
// Gated to Officers/Governors (manage_operations); a Student is redirected away
// by requireCapability, matching the API's own finance/summary gate.
export async function financeSummary(): Promise<DepartmentFundSummary> {
  await requireCapability("manage_operations");
  return apiPost<DepartmentFundSummary>("finance/summary");
}

// The open Semester's Expenses (#347), read by the server shell and the cache's
// queryFn. Same manage_operations gate as the Fund.
export async function listExpenses(): Promise<ExpenseListItem[]> {
  await requireCapability("manage_operations");
  return (await apiPost<ExpenseListResponse>("expense/list")).expenses;
}

// The Category vocabulary that fills the record-Expense picker (#345/#347).
export async function listExpenseCategories(): Promise<string[]> {
  await requireCapability("manage_operations");
  return (await apiPost<ExpenseCategoryListResponse>("expense-category/list")).categories;
}

// Returned rather than thrown so the Officer sees the API's reason (no open
// Semester, unknown Category), which Next redacts from a thrown Server Action
// message in production — mirrors the clearance SAF actions.
type Result = { error?: string };

export async function recordExpense(input: RecordExpenseRequest): Promise<Result> {
  await requireCapability("manage_operations");
  try {
    await apiPost("expense/record", input);
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
  return {};
}

// Voided, never deleted: the API keeps the row with the voiding Officer.
export async function voidExpense(expenseId: string): Promise<Result> {
  await requireCapability("manage_operations");
  try {
    await apiPost("expense/void", { expenseId });
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
  return {};
}
