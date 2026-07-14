import { describe, expect, it } from "vitest";
import { deriveWholeDayPenalty, validateEventInput } from "./events";

describe("validateEventInput", () => {
  const semesterRange = { startDate: "2026-06-01", endDate: "2026-10-31" };
  const valid = {
    name: "Freshman Orientation",
    type: "half_day" as const,
    halfDayPenaltyAmount: "50.00",
    date: "2026-07-15",
  };

  it("accepts a well-formed half-day Event", () => {
    expect(validateEventInput(valid, semesterRange)).toEqual([]);
  });

  it("accepts a well-formed whole-day Event", () => {
    expect(validateEventInput({ ...valid, type: "whole_day" }, semesterRange)).toEqual([]);
  });

  it("rejects a blank name", () => {
    expect(validateEventInput({ ...valid, name: "  " }, semesterRange)).toEqual([
      { field: "name", message: "Name is required" },
    ]);
  });

  it("rejects an invalid type", () => {
    expect(validateEventInput({ ...valid, type: "quarter_day" as never }, semesterRange)).toEqual([
      { field: "type", message: "Select whole-day or half-day" },
    ]);
  });

  it("rejects a zero penalty amount", () => {
    expect(validateEventInput({ ...valid, halfDayPenaltyAmount: "0" }, semesterRange)).toEqual([
      { field: "halfDayPenaltyAmount", message: "Penalty amount must be greater than 0" },
    ]);
  });

  it("rejects a negative penalty amount", () => {
    expect(validateEventInput({ ...valid, halfDayPenaltyAmount: "-5" }, semesterRange)).toEqual([
      { field: "halfDayPenaltyAmount", message: "Penalty amount must be greater than 0" },
    ]);
  });

  it("rejects a non-numeric penalty amount", () => {
    expect(validateEventInput({ ...valid, halfDayPenaltyAmount: "abc" }, semesterRange)).toEqual([
      { field: "halfDayPenaltyAmount", message: "Penalty amount must be greater than 0" },
    ]);
  });

  it("rejects a blank date", () => {
    expect(validateEventInput({ ...valid, date: "" }, semesterRange)).toEqual([
      { field: "date", message: "Date is required" },
    ]);
  });

  it("rejects a date before the open Semester", () => {
    expect(validateEventInput({ ...valid, date: "2026-05-31" }, semesterRange)).toEqual([
      { field: "date", message: "Date must fall within the open Semester" },
    ]);
  });

  it("rejects a date after the open Semester", () => {
    expect(validateEventInput({ ...valid, date: "2026-11-01" }, semesterRange)).toEqual([
      { field: "date", message: "Date must fall within the open Semester" },
    ]);
  });
});

describe("deriveWholeDayPenalty", () => {
  it("doubles the half-day amount", () => {
    expect(deriveWholeDayPenalty("50.00")).toBe(100);
  });

  it("handles decimal pesos", () => {
    expect(deriveWholeDayPenalty("25.50")).toBe(51);
  });
});
