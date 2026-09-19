import { describe, expect, it } from "vitest";
import { computeLedger } from "./ledger";

describe("computeLedger", () => {
  it("includes both virtual halves for a whole-day no-show", () => {
    const ledger = computeLedger({
      campusDate: "2026-09-19", semesterEndDate: "2026-12-31",
      events: [{ id: "event", name: "Assembly", date: "2026-09-18", type: "whole_day", halfDayPenaltyAmount: "50.00" }],
      students: [{ id: "student", createdAt: new Date("2026-01-01T00:00:00Z") }], sessions: [], penalties: [], payments: [],
    });
    expect(ledger.students.get("student")).toMatchObject({ total: 100, outstanding: 100 });
    expect(ledger.events[0]).toMatchObject({ present: 0, absent: 2 });
  });
});
