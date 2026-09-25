// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import React from "react";
import type { DepartmentFundSummary } from "@attendance/contracts";
import { FinanceView } from "./finance-view";

vi.mock("./actions", () => ({ financeSummary: vi.fn() }));

afterEach(() => cleanup());

function renderView(summary: DepartmentFundSummary) {
  // staleTime keeps the seeded initialData from triggering the mocked queryFn.
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  return render(
    <QueryClientProvider client={client}>
      <FinanceView initialData={summary} />
    </QueryClientProvider>,
  );
}

describe("FinanceView", () => {
  it("renders the balance and the two money-in figures as pesos with two decimals", () => {
    renderView({ balance: 1349.5, collectedSafFees: 1500, collectedPenalties: 200, totalExpenses: 350.5 });

    expect(screen.getByTestId("fund-balance")).toHaveTextContent("₱1349.50");
    expect(screen.getByText("₱1500.00")).toBeInTheDocument();
    expect(screen.getByText("₱200.00")).toBeInTheDocument();
    expect(screen.getByText("₱350.50")).toBeInTheDocument();
  });

  it("shows a negative balance plainly, in red", () => {
    renderView({ balance: -150, collectedSafFees: 100, collectedPenalties: 0, totalExpenses: 250 });

    const balance = screen.getByTestId("fund-balance");
    expect(balance).toHaveTextContent("-₱150.00");
    expect(balance).toHaveClass("text-red-600");
  });

  it("renders an all-zero Fund without error", () => {
    renderView({ balance: 0, collectedSafFees: 0, collectedPenalties: 0, totalExpenses: 0 });
    expect(screen.getByTestId("fund-balance")).toHaveTextContent("₱0.00");
  });
});
