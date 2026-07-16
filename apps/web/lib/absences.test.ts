import { describe, expect, it } from "vitest";
import { missingHalves } from "./absences";

describe("missingHalves", () => {
  describe("whole_day", () => {
    it("full no-show owes both halves", () => {
      expect(missingHalves("whole_day", { am: false, pm: false })).toEqual(["am", "pm"]);
    });
    it("missed pm only owes pm", () => {
      expect(missingHalves("whole_day", { am: true, pm: false })).toEqual(["pm"]);
    });
    it("attended both owes nothing", () => {
      expect(missingHalves("whole_day", { am: true, pm: true })).toEqual([]);
    });
  });

  describe("half_day", () => {
    it("total no-show owes one (am)", () => {
      expect(missingHalves("half_day", { am: false, pm: false })).toEqual(["am"]);
    });
    it("attended the am owes nothing", () => {
      expect(missingHalves("half_day", { am: true, pm: false })).toEqual([]);
    });
    it("attended the pm owes nothing — not double-charged on am", () => {
      expect(missingHalves("half_day", { am: false, pm: true })).toEqual([]);
    });
  });
});
