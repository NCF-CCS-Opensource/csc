import { describe, expect, it } from "vitest";
import { deriveWholeDayPenalty, validateEventInput } from "./events";

describe("validateEventInput", () => {
  const valid = {
    name: "Freshman Orientation",
    type: "half_day" as const,
    halfDayPenaltyAmount: "50.00",
  };

  it("accepts a well-formed half-day Event", () => {
    expect(validateEventInput(valid)).toEqual([]);
  });

  it("accepts a well-formed whole-day Event", () => {
    expect(validateEventInput({ ...valid, type: "whole_day" })).toEqual([]);
  });

  it("rejects a blank name", () => {
    expect(validateEventInput({ ...valid, name: "  " })).toEqual([
      { field: "name", message: "Name is required" },
    ]);
  });

  it("rejects an invalid type", () => {
    expect(validateEventInput({ ...valid, type: "quarter_day" as never })).toEqual([
      { field: "type", message: "Select whole-day or half-day" },
    ]);
  });

  it("rejects a zero penalty amount", () => {
    expect(validateEventInput({ ...valid, halfDayPenaltyAmount: "0" })).toEqual([
      { field: "halfDayPenaltyAmount", message: "Penalty amount must be greater than 0" },
    ]);
  });

  it("rejects a negative penalty amount", () => {
    expect(validateEventInput({ ...valid, halfDayPenaltyAmount: "-5" })).toEqual([
      { field: "halfDayPenaltyAmount", message: "Penalty amount must be greater than 0" },
    ]);
  });

  it("rejects a non-numeric penalty amount", () => {
    expect(validateEventInput({ ...valid, halfDayPenaltyAmount: "abc" })).toEqual([
      { field: "halfDayPenaltyAmount", message: "Penalty amount must be greater than 0" },
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
