import type { DepartmentFundSummary, FinancialReportData } from "@attendance/contracts";

// The Department Fund read model (issue #346) — a composed read model beside
// computeFinancialReport/computeLedger, with no stored aggregate (ADR 0021).
// Money-in reuses the existing financial computation: it reads each Semester's
// already-computed collected figures rather than re-summing Payments, so no
// penalty/SAF arithmetic is re-implemented here. The Fund is cumulative across
// every Semester and never resets (ADR 0025).
export type DepartmentFundInput = {
  // One computed FinancialReportData per Semester (from computeFinancialReport).
  // Its collected figures already exclude voided Payments; saf is null for a
  // Semester closed before SAF tracking began (ADR 0024), which has no SAF Fee
  // and so contributes 0 collected SAF.
  semesterReports: FinancialReportData[];
  // Every Expense across all time. A voided Expense stops reducing the Fund.
  expenses: { amount: string; voidedAt: Date | null }[];
};

export function computeDepartmentFund(input: DepartmentFundInput): DepartmentFundSummary {
  const collectedSafFees = input.semesterReports.reduce(
    (sum, report) => sum + (report.saf?.collected ?? 0),
    0,
  );
  const collectedPenalties = input.semesterReports.reduce(
    (sum, report) => sum + report.overview.totalPaymentsCollected,
    0,
  );
  const totalExpenses = input.expenses
    .filter((expense) => !expense.voidedAt)
    .reduce((sum, expense) => sum + Number(expense.amount), 0);

  return {
    collectedSafFees,
    collectedPenalties,
    totalExpenses,
    // A negative balance is legal — Expenses can exceed money-in (ADR 0025).
    balance: collectedSafFees + collectedPenalties - totalExpenses,
  };
}
