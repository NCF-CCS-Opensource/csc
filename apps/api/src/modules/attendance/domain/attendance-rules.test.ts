import { describe, expect, it } from "vitest";
import { isAbsent, owedHalves } from "./attendance-rules";

describe("attendance rules", () => {
  it("charges only the missing whole-day halves", () => {
    expect(owedHalves("whole_day", { am: true, pm: false }, new Set(["am"]))).toEqual(["pm"]);
    expect(isAbsent({ timeIn: new Date(), timeOut: null })).toBe(true);
  });
});
