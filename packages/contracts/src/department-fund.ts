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
}
