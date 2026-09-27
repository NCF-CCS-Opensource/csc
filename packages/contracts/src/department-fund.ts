// The Department Fund summary (issue #346): the council's single running cash
// balance, cumulative across all Semesters and never reset (ADR 0025). The
// balance is collectedSafFees + collectedPenalties − totalExpenses, counting
// only un-voided Payments and un-voided Expenses. The two money-in figures are
// carried alongside the balance so the /finance page can show what makes it up.
// A negative balance is legal (Expenses can exceed money-in) and shown plainly.
export interface DepartmentFundSummary {
  balance: number;
  collectedSafFees: number;
  collectedPenalties: number;
  totalExpenses: number;
  // Per-Semester spending breakdown (issue #348): each Semester's full
  // collections beside the Expenses tagged to it, so an Officer can compare
  // this term's outflow against previous terms. This is the second lens — a
  // Semester's whole collections, not the continuous balance — so it is NOT
  // expected to tie out to `balance`.
  semesterBreakdown: DepartmentFundSemesterLine[];
  // Still-expected receivables (issue #348): un-collected SAF and Penalty
  // totals, reported separately and NEVER subtracted into `balance` — money
  // owed is not cash on hand (CONTEXT.md Department Fund).
  outstanding: { safFees: number; penalties: number };
}

export interface DepartmentFundSemesterLine {
  semesterId: string;
  semesterName: string;
  collected: number; // collected SAF Fees + collected Penalties for the Semester
  spent: number; // un-voided Expenses tagged to the Semester
}
