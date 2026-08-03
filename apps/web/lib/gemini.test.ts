import { describe, expect, it, vi } from "vitest";
import {
  buildFinancialReportPrompt,
  buildPerEventReportPrompt,
  buildPerSemesterReportPrompt,
  buildPerStudentReportPrompt,
  generateReportNarrative,
} from "./gemini";
import type { FinancialReportData, PerEventReportData, PerSemesterReportData, PerStudentReportData } from "./reports";




describe("buildPerEventReportPrompt", () => {
  const sampleData: PerEventReportData = {
    event: {
      id: "e1",
      name: "General Assembly",
      date: "2024-03-10",
      venue: "Gymnasium",
      type: "whole_day",
      halfDayPenaltyAmount: "50.00",
      semesterName: "2023-2024 2nd Semester",
    },
    summary: {
      totalStudents: 100,
      presentHalves: 150,
      incompleteHalves: 10,
      absentHalves: 40,
      attendanceRate: 78.9,
      amBreakdown: { present: 80, incomplete: 5, absent: 15 },
      pmBreakdown: { present: 70, incomplete: 5, absent: 25 },
    },
    programBreakdowns: [
      {
        program: "BSCS",
        totalStudents: 40,
        presentHalves: 70,
        incompleteHalves: 2,
        absentHalves: 8,
        rate: 89.7,
      },
      {
        program: "BSIT",
        totalStudents: 60,
        presentHalves: 80,
        incompleteHalves: 8,
        absentHalves: 32,
        rate: 71.4,
      },
    ],
    studentDetails: [
      {
        studentId: "2024-0001",
        name: "Alice Smith",
        program: "BSCS",
        amStatus: "present",
        pmStatus: "present",
        penaltyAmount: 0,
      },
    ],
    totalPenalties: 2000,
  };

  it("produces a non-empty prompt containing aggregate metrics and no student PII", () => {
    const prompt = buildPerEventReportPrompt(sampleData);
    expect(prompt).toContain("General Assembly");
    expect(prompt).toContain("2023-2024 2nd Semester");
    expect(prompt).toContain("78.9%");
    expect(prompt).toContain("BSCS");
    expect(prompt).toContain("BSIT");
    expect(prompt).toContain("2000");

    // Must NOT contain PII (e.g. Alice Smith, 2024-0001)
    expect(prompt).not.toContain("Alice Smith");
    expect(prompt).not.toContain("2024-0001");
  });
});

describe("buildPerStudentReportPrompt", () => {
  it("produces a prompt with aggregate standing statistics without student PII", () => {
    const studentData: PerStudentReportData = {
      student: { id: "s1", name: "Alice Smith", studentId: "2024-0001", program: "BSCS" },
      semesterName: "2023-2024 2nd Semester",
      asOfTimestamp: "2024-03-20 10:00:00",
      standing: {
        totalEvents: 5,
        sessionsAttended: 8,
        sessionsAbsent: 2,
        attendanceRate: 80,
        totalPenaltiesCharged: 100,
        totalPaymentsMade: 50,
        outstandingBalance: 50,
      },
      clearanceStatus: "NOT CLEARED — Outstanding balance: ₱50.00",
      eventsBreakdown: [],
    };

    const prompt = buildPerStudentReportPrompt(studentData);
    expect(prompt).toContain("BSCS");
    expect(prompt).toContain("80.0%");
    expect(prompt).toContain("₱50.00");

    expect(prompt).not.toContain("Alice Smith");
    expect(prompt).not.toContain("2024-0001");
  });
});

describe("buildPerSemesterReportPrompt", () => {
  it("produces a prompt with cross-semester aggregate statistics without student PII", () => {
    const semData: PerSemesterReportData = {
      semester: {
        id: "sem1",
        name: "2023-2024 2nd Semester",
        startDate: "2024-01-01",
        endDate: "2024-05-31",
        closedAt: null,
      },
      asOfTimestamp: "2024-03-20 10:00:00",
      overall: {
        totalRegisteredStudents: 100,
        totalEvents: 4,
        overallAttendanceRate: 85.5,
        totalPenaltiesCharged: 5000,
        totalCollected: 3000,
        totalOutstanding: 2000,
      },
      programBreakdown: [
        { program: "BSCS", studentCount: 40, attendanceRate: 90, totalPenalties: 2000, totalPaid: 1500, outstanding: 500 },
      ],
      eventSummary: [
        { id: "e1", date: "2024-01-15", name: "Orientation", attendanceRate: 95, penaltiesGenerated: 500 },
      ],
      clearanceReadiness: [
        { program: "BSCS", clearedCount: 30, notClearedCount: 10 },
      ],
    };

    const prompt = buildPerSemesterReportPrompt(semData);
    expect(prompt).toContain("2023-2024 2nd Semester");
    expect(prompt).toContain("85.5%");
    expect(prompt).toContain("BSCS");
    expect(prompt).toContain("Orientation");
  });
});

describe("buildFinancialReportPrompt", () => {
  it("produces a prompt with aggregate financial statistics without student PII", () => {
    const finData: FinancialReportData = {
      semester: {
        id: "sem1",
        name: "2023-2024 2nd Semester",
        startDate: "2024-01-01",
        endDate: "2024-05-31",
        closedAt: null,
      },
      asOfTimestamp: "2024-03-20 10:00:00",
      overview: {
        totalPenaltiesCharged: 10000,
        totalPaymentsCollected: 7500,
        totalOutstandingBalance: 2500,
        collectionRate: 75,
      },
      programBreakdown: [
        { program: "BSCS", totalPenalties: 5000, totalCollected: 4000, outstanding: 1000, collectionRate: 80 },
      ],
      eventBreakdown: [
        { id: "e1", name: "Assembly", penaltiesGenerated: 3000, amountCollected: 2500, outstanding: 500 },
      ],
      outstandingBalancesList: [
        { studentId: "2024-0001", name: "Alice Smith", program: "BSCS", amountOwed: 500 },
      ],
      paymentLogSummary: {
        totalTransactions: 10,
        dateRange: "2024-01-01 to 2024-03-20",
        receivingOfficers: ["Officer Jane"],
      },
    };

    const prompt = buildFinancialReportPrompt(finData);
    expect(prompt).toContain("2023-2024 2nd Semester");
    expect(prompt).toContain("75.0%");
    expect(prompt).toContain("BSCS");
    expect(prompt).toContain("Assembly");
    expect(prompt).not.toContain("Alice Smith");
    expect(prompt).not.toContain("2024-0001");
  });
});




describe("generateReportNarrative", () => {
  it("returns null gracefully when GEMINI_API_KEY is unset or API call fails", async () => {
    const originalEnv = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const result = await generateReportNarrative("test prompt");
    expect(result).toBeNull();

    process.env.GEMINI_API_KEY = originalEnv;
  });
});
