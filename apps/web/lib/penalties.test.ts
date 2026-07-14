import { describe, expect, it } from "vitest";
import { computeSessionPenalty } from "./penalties";

describe("computeSessionPenalty", () => {
  it("charges the half-day amount when the session is absent (both missing)", () => {
    expect(
      computeSessionPenalty({ timeIn: null, timeOut: null }, "50.00"),
    ).toBe("50.00");
  });

  it("charges the half-day amount when only timeIn is missing", () => {
    expect(
      computeSessionPenalty({ timeIn: null, timeOut: new Date() }, "50.00"),
    ).toBe("50.00");
  });

  it("charges the half-day amount when only timeOut is missing", () => {
    expect(
      computeSessionPenalty({ timeIn: new Date(), timeOut: null }, "50.00"),
    ).toBe("50.00");
  });

  it("charges nothing when both timeIn and timeOut are present", () => {
    expect(
      computeSessionPenalty({ timeIn: new Date(), timeOut: new Date() }, "50.00"),
    ).toBeNull();
  });
});
