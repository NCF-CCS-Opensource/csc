import { describe, expect, it, vi } from "vitest";
import {
  buildPerEventReportPrompt,
  generateReportNarrative,
} from "./gemini";
import type { PerEventReportData } from "./reports";

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

describe("generateReportNarrative", () => {
  it("returns null gracefully when GEMINI_API_KEY is unset or API call fails", async () => {
    const originalEnv = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const result = await generateReportNarrative("test prompt");
    expect(result).toBeNull();

    process.env.GEMINI_API_KEY = originalEnv;
  });
});
