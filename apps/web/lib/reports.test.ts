import { describe, expect, it } from "vitest";
import {
  computePerEventReport,
  isEventPastInManila,
  type PerEventReportInput,
} from "./reports";

describe("isEventPastInManila", () => {
  it("returns true when event date is before campus date", () => {
    expect(isEventPastInManila("2024-03-09", "2024-03-10")).toBe(true);
  });

  it("returns false when event date is equal to campus date (today)", () => {
    expect(isEventPastInManila("2024-03-10", "2024-03-10")).toBe(false);
  });

  it("returns false when event date is after campus date (future)", () => {
    expect(isEventPastInManila("2024-03-11", "2024-03-10")).toBe(false);
  });

  it("evaluates Asia/Manila date boundaries accurately across UTC boundary", () => {
    // 2024-03-09T16:00:00Z is 2024-03-10 00:00:00 in Manila (+8)
    const manilaMidnight = new Date("2024-03-09T16:00:00Z");
    expect(isEventPastInManila("2024-03-09", manilaMidnight)).toBe(true);
    expect(isEventPastInManila("2024-03-10", manilaMidnight)).toBe(false);
  });
});

describe("computePerEventReport", () => {
  const sampleInput: PerEventReportInput = {
    event: {
      id: "e1",
      name: "General Assembly",
      date: "2024-03-10",
      venue: "Gymnasium",
      type: "whole_day",
      halfDayPenaltyAmount: "50.00",
      semesterName: "2023-2024 2nd Semester",
    },
    students: [
      { id: "s1", name: "Alice Smith", studentId: "2024-0001", program: "BSCS" },
      { id: "s2", name: "Bob Jones", studentId: "2024-0002", program: "BSIT" },
      { id: "s3", name: "Charlie Brown", studentId: "2024-0003", program: "BSIS" },
      { id: "s4", name: "Diana Prince", studentId: "2024-0004", program: "ACT" },
      { id: "s5", name: "Evan Wright", studentId: "2024-0005", program: "BSCS" },
    ],
    sessions: [
      // s1 attended both AM and PM
      { id: "sess1", studentId: "s1", half: "am", timeIn: new Date(), timeOut: new Date() },
      { id: "sess2", studentId: "s1", half: "pm", timeIn: new Date(), timeOut: new Date() },
      // s2 attended AM only (incomplete PM)
      { id: "sess3", studentId: "s2", half: "am", timeIn: new Date(), timeOut: new Date() },
      { id: "sess4", studentId: "s2", half: "pm", timeIn: new Date(), timeOut: null },
      // s3 attended PM only (incomplete AM)
      { id: "sess5", studentId: "s3", half: "am", timeIn: null, timeOut: new Date() },
      { id: "sess6", studentId: "s3", half: "pm", timeIn: new Date(), timeOut: new Date() },
      // s4, s5 have no sessions (full no-shows)
    ],
    penalties: [
      { id: "p1", attendanceSessionId: "sess4", studentId: "s2", amount: "50.00" },
      { id: "p2", attendanceSessionId: "sess5", studentId: "s3", amount: "50.00" },
    ],
    programs: ["BSCS", "BSIT", "BSIS", "ACT"],
  };

  it("aggregates attendance summary for whole-day event", () => {
    const report = computePerEventReport(sampleInput);
    expect(report.event).toEqual(sampleInput.event);
    
    // Sessions:
    // s1: AM present, PM present
    // s2: AM present, PM incomplete (so absent half)
    // s3: AM incomplete (absent half), PM present
    // s4: AM absent, PM absent
    // s5: AM absent, PM absent
    // Total student halves: 5 students * 2 halves = 10
    // Present halves: s1 (AM, PM), s2 (AM), s3 (PM) = 4
    // Incomplete halves: s2 (PM), s3 (AM) = 2
    // Absent halves: s4 (AM, PM), s5 (AM, PM) = 4
    // Total resolved halves (present + absent): 4 + 4 = 8
    // Rate: 4 / 8 * 100 = 50%
    expect(report.summary.totalStudents).toBe(5);
    expect(report.summary.presentHalves).toBe(4);
    expect(report.summary.incompleteHalves).toBe(2);
    expect(report.summary.absentHalves).toBe(4);
    expect(report.summary.attendanceRate).toBe(50);
    expect(report.summary.amBreakdown).toEqual({ present: 2, incomplete: 1, absent: 2 });
    expect(report.summary.pmBreakdown).toEqual({ present: 2, incomplete: 1, absent: 2 });
  });

  it("calculates program breakdowns correctly", () => {
    const report = computePerEventReport(sampleInput);
    const bscs = report.programBreakdowns.find((p) => p.program === "BSCS");
    expect(bscs).toBeDefined();
    // BSCS: s1 (2 present) + s5 (2 absent) = 2 present, 2 absent out of 4 resolved halves (rate 50%)
    expect(bscs).toMatchObject({
      program: "BSCS",
      totalStudents: 2,
      presentHalves: 2,
      incompleteHalves: 0,
      absentHalves: 2,
      rate: 50,
    });

    const bsit = report.programBreakdowns.find((p) => p.program === "BSIT");
    expect(bsit).toMatchObject({
      program: "BSIT",
      totalStudents: 1,
      presentHalves: 1,
      incompleteHalves: 1,
      absentHalves: 0,
      rate: 100, // 1 present / (1 present + 0 absent) = 100%
    });
  });

  it("generates student detail list with penalty amounts", () => {
    const report = computePerEventReport(sampleInput);
    expect(report.studentDetails).toHaveLength(5);
    const alice = report.studentDetails.find((s) => s.studentId === "2024-0001")!;
    expect(alice).toMatchObject({
      name: "Alice Smith",
      program: "BSCS",
      amStatus: "present",
      pmStatus: "present",
      penaltyAmount: 0,
    });

    const bob = report.studentDetails.find((s) => s.studentId === "2024-0002")!;
    expect(bob).toMatchObject({
      name: "Bob Jones",
      program: "BSIT",
      amStatus: "present",
      pmStatus: "incomplete",
      penaltyAmount: 50,
    });

    const totalPenalties = sampleInput.penalties.reduce((sum, p) => sum + Number(p.amount), 0) + 
      (2 * 2 * 50); // s4 & s5 full no-shows = 2 students * 2 halves * 50 = 200
    expect(report.totalPenalties).toBe(300);
  });
});
