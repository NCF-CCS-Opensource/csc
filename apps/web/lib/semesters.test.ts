import { describe, expect, it } from "vitest";
import { validateSemesterDates } from "./semesters";

describe("validateSemesterDates", () => {
  it("accepts a start date before the end date", () => {
    expect(validateSemesterDates("2026-01-01", "2026-05-31")).toEqual([]);
  });

  it("rejects an end date before the start date", () => {
    expect(validateSemesterDates("2026-05-31", "2026-01-01")).toEqual([
      { field: "endDate", message: "End date must be after the start date" },
    ]);
  });

  it("rejects equal start and end dates", () => {
    expect(validateSemesterDates("2026-01-01", "2026-01-01")).toEqual([
      { field: "endDate", message: "End date must be after the start date" },
    ]);
  });

  it("rejects a missing start date", () => {
    expect(validateSemesterDates("", "2026-05-31")).toEqual([
      { field: "startDate", message: "Start date is required" },
    ]);
  });

  it("rejects a missing end date", () => {
    expect(validateSemesterDates("2026-01-01", "")).toEqual([
      { field: "endDate", message: "End date is required" },
    ]);
  });
});
