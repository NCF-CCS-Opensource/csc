// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import React from "react";
import type { DepartmentFundSummary, ExpenseListItem, RecordExpenseRequest } from "@attendance/contracts";
import { FinanceView } from "./finance-view";

const recordExpense = vi.fn<(input: RecordExpenseRequest) => Promise<{ error?: string }>>(async () => ({}));
const voidExpense = vi.fn<(expenseId: string) => Promise<{ error?: string }>>(async () => ({}));
vi.mock("./actions", () => ({
  financeSummary: vi.fn(),
  listExpenses: vi.fn(),
  recordExpense: (input: RecordExpenseRequest) => recordExpense(input),
  voidExpense: (expenseId: string) => voidExpense(expenseId),
}));

afterEach(() => {
  cleanup();
  recordExpense.mockClear();
  voidExpense.mockClear();
});

const summary: DepartmentFundSummary = { balance: 0, collectedSafFees: 0, collectedPenalties: 0, totalExpenses: 0 };

function renderView({
  data = summary,
  expenses = [] as ExpenseListItem[],
  categories = ["Supplies", "Events"] as string[],
} = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  return render(
    <QueryClientProvider client={client}>
      <FinanceView initialData={data} initialExpenses={expenses} categories={categories} />
    </QueryClientProvider>,
  );
}

describe("FinanceView", () => {
  it("renders the balance and the two money-in figures as pesos with two decimals", () => {
    renderView({ data: { balance: 1349.5, collectedSafFees: 1500, collectedPenalties: 200, totalExpenses: 350.5 } });

    expect(screen.getByTestId("fund-balance")).toHaveTextContent("₱1349.50");
    expect(screen.getByText("₱1500.00")).toBeInTheDocument();
    expect(screen.getByText("₱200.00")).toBeInTheDocument();
    expect(screen.getByText("₱350.50")).toBeInTheDocument();
  });

  it("shows a negative balance plainly, in red", () => {
    renderView({ data: { balance: -150, collectedSafFees: 100, collectedPenalties: 0, totalExpenses: 250 } });

    const balance = screen.getByTestId("fund-balance");
    expect(balance).toHaveTextContent("-₱150.00");
    expect(balance).toHaveClass("text-red-600");
  });

  it("renders an all-zero Fund without error", () => {
    renderView();
    expect(screen.getByTestId("fund-balance")).toHaveTextContent("₱0.00");
  });

  it("submits a recorded Expense with the entered fields", async () => {
    renderView();

    fireEvent.change(screen.getByLabelText("Amount"), { target: { value: "120.50" } });
    fireEvent.change(screen.getByLabelText("Description"), { target: { value: "Printer ink" } });
    fireEvent.change(screen.getByLabelText("Category"), { target: { value: "Events" } });
    fireEvent.click(screen.getByRole("button", { name: "Record Expense" }));

    await waitFor(() => expect(recordExpense).toHaveBeenCalledTimes(1));
    expect(recordExpense).toHaveBeenCalledWith(
      expect.objectContaining({ amount: "120.50", description: "Printer ink", category: "Events" }),
    );
  });

  it("lists Expenses and voids an un-voided one; a voided row shows who voided it", async () => {
    const expenses: ExpenseListItem[] = [
      { id: "e1", category: "Supplies", amount: "120.00", description: "Ink", incurredOn: "2026-03-01", recordedBy: "Ada Lovelace", voidedAt: null, voidedBy: null },
      { id: "e2", category: "Events", amount: "80.00", description: "Tarp", incurredOn: "2026-02-01", recordedBy: "Ada Lovelace", voidedAt: "2026-03-05T00:00:00.000Z", voidedBy: "Grace Hopper" },
    ];
    renderView({ expenses });

    expect(screen.getByText("Ink")).toBeInTheDocument();
    expect(screen.getByText("Voided by Grace Hopper")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Void the ₱120.00 Supplies Expense/ }));
    await waitFor(() => expect(voidExpense).toHaveBeenCalledWith("e1"));
  });
});
