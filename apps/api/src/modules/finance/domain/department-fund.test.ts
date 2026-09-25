import { describe, expect, it } from "vitest";
import type { FinancialReportData } from "@attendance/contracts";
import { computeFinancialReport } from "../../report/domain/report";
import { computeDepartmentFund } from "./department-fund";

// A minimal FinancialReportData carrying only the two figures the Fund reads
// (collected SAF + collected Penalties); the breakdown lists are irrelevant to
// computeDepartmentFund, so they stay empty.
function report(collectedPenalties: number, collectedSaf: number | null): FinancialReportData {
  return {
    semester: { id: "sem", name: "S", startDate: "2024-01-01", endDate: "2024-05-31", closedAt: null },
    asOfTimestamp: "2024-03-20 10:00:00",
    overview: {
      totalPenaltiesCharged: 0,
      totalPaymentsCollected: collectedPenalties,
      totalOutstandingBalance: 0,
      collectionRate: 0,
    },
    saf: collectedSaf === null ? null : { charged: 0, collected: collectedSaf, outstanding: 0 },
    programBreakdown: [],
    eventBreakdown: [],
    outstandingBalancesList: [],
    paymentLogSummary: { totalTransactions: 0, dateRange: "", receivingOfficers: [] },
  };
}

describe("computeDepartmentFund", () => {
  it("balance = collected SAF + collected Penalties − Expenses, with the money-in figures alongside", () => {
    const fund = computeDepartmentFund({
      semesterReports: [report(200, 1500)],
      expenses: [
        { amount: "300.00", voidedAt: null },
        { amount: "50.50", voidedAt: null },
      ],
    });
    expect(fund.collectedSafFees).toBe(1500);
    expect(fund.collectedPenalties).toBe(200);
    expect(fund.totalExpenses).toBe(350.5);
    expect(fund.balance).toBe(1349.5); // 1500 + 200 − 350.50
  });

  it("excludes voided Payments (via the reused financial computation) and voided Expenses", () => {
    // Money-in is a real computeFinancialReport: one un-voided and one voided
    // SAF Fee Payment, plus one un-voided Penalty Payment (a voided Penalty
    // Payment never reaches computeFinancialReport — the repository filters it).
    const semesterReport = computeFinancialReport({
      semester: { id: "sem1", name: "S", startDate: "2024-01-01", endDate: "2024-05-31", closedAt: null },
      students: [
        { id: "s1", name: "Alice", studentId: "2024-0001", program: "BSCS" },
        { id: "s2", name: "Bob", studentId: "2024-0002", program: "BSIT" },
      ],
      events: [],
      sessions: [],
      penalties: [
        { id: "p1", attendanceSessionId: null, studentId: "s1", amount: "50.00" },
        { id: "p2", attendanceSessionId: null, studentId: "s2", amount: "50.00" },
      ],
      payments: [{ id: "pay1", penaltyId: "p1", amount: "50.00" }],
      programs: ["BSCS", "BSIT"],
      safFeeAmount: "500.00",
      safFeePayments: [
        { studentId: "s1", amount: "500.00", voidedAt: null },
        { studentId: "s2", amount: "500.00", voidedAt: new Date() },
      ],
      asOfTimestamp: "2024-03-20 10:00:00",
    });

    const fund = computeDepartmentFund({
      semesterReports: [semesterReport],
      expenses: [
        { amount: "100.00", voidedAt: null },
        { amount: "999.00", voidedAt: new Date() }, // voided → ignored
      ],
    });

    expect(fund.collectedSafFees).toBe(500); // the voided SAF Payment excluded
    expect(fund.collectedPenalties).toBe(50); // only the un-voided Penalty Payment
    expect(fund.totalExpenses).toBe(100); // the voided Expense excluded
    expect(fund.balance).toBe(450); // 500 + 50 − 100
  });

  it("is cumulative across Semesters and never resets", () => {
    const fund = computeDepartmentFund({
      semesterReports: [
        report(100, 500), // Semester 1
        report(300, 1000), // Semester 2 — adds to, never replaces, Semester 1
      ],
      expenses: [{ amount: "200.00", voidedAt: null }],
    });
    expect(fund.collectedSafFees).toBe(1500); // 500 + 1000, carried forward
    expect(fund.collectedPenalties).toBe(400); // 100 + 300
    expect(fund.balance).toBe(1700); // 1500 + 400 − 200
  });

  it("counts a pre-tracking Semester (null SAF, ADR 0024) as 0 collected SAF, still counting its Penalties", () => {
    const fund = computeDepartmentFund({
      semesterReports: [report(75, null)],
      expenses: [],
    });
    expect(fund.collectedSafFees).toBe(0);
    expect(fund.collectedPenalties).toBe(75);
    expect(fund.balance).toBe(75);
  });

  it("is zero when there are no Semesters and no Expenses", () => {
    const fund = computeDepartmentFund({ semesterReports: [], expenses: [] });
    expect(fund).toEqual({ balance: 0, collectedSafFees: 0, collectedPenalties: 0, totalExpenses: 0 });
  });

  it("goes negative when Expenses exceed money-in", () => {
    const fund = computeDepartmentFund({
      semesterReports: [report(0, 100)],
      expenses: [{ amount: "250.00", voidedAt: null }],
    });
    expect(fund.balance).toBe(-150);
  });
});
