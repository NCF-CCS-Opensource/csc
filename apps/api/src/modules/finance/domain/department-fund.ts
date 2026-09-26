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
  // Every Expense across all time, each carrying the Semester it was recorded
  // against (issue #348). A voided Expense stops reducing the Fund.
  expenses: { amount: string; voidedAt: Date | null; semesterId: string }[];
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
  const liveExpenses = input.expenses.filter((expense) => !expense.voidedAt);
  const totalExpenses = liveExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

  // Per-Semester spending breakdown (issue #348): un-voided Expenses summed by
  // the Semester they were tagged to, beside that Semester's full collections.
  // A different lens from the continuous balance, so it need not tie out.
  const spentBySemester = new Map<string, number>();
  for (const expense of liveExpenses) {
    spentBySemester.set(
      expense.semesterId,
      (spentBySemester.get(expense.semesterId) ?? 0) + Number(expense.amount),
    );
  }
  const semesterBreakdown = input.semesterReports.map((report) => ({
    semesterId: report.semester.id,
    semesterName: report.semester.name,
    collected: (report.saf?.collected ?? 0) + report.overview.totalPaymentsCollected,
    spent: spentBySemester.get(report.semester.id) ?? 0,
  }));

  return {
    collectedSafFees,
    collectedPenalties,
    totalExpenses,
    // A negative balance is legal — Expenses can exceed money-in (ADR 0025).
    // Outstanding receivables are reported separately, never subtracted here.
    balance: collectedSafFees + collectedPenalties - totalExpenses,
    semesterBreakdown,
    // Still-expected SAF and Penalty totals, reusing computeFinancialReport's
    // outstanding figures. Kept apart from the balance — money owed, not cash.
    outstanding: {
      safFees: input.semesterReports.reduce((sum, r) => sum + (r.saf?.outstanding ?? 0), 0),
      penalties: input.semesterReports.reduce((sum, r) => sum + r.overview.totalOutstandingBalance, 0),
    },
  };
}
