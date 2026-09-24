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

  it("computes every requested student's standing in one pass, including full no-shows with no stored session rows", () => {
    const ledger = computeLedger({
      campusDate: "2026-09-19", semesterEndDate: "2026-12-31",
      events: [{ id: "event", name: "Assembly", date: "2026-09-18", type: "half_day", halfDayPenaltyAmount: "50.00" }],
      students: [
        { id: "attended", createdAt: new Date("2026-01-01T00:00:00Z") },
        { id: "no-show", createdAt: new Date("2026-01-01T00:00:00Z") },
      ],
      sessions: [{ id: "session", eventId: "event", studentId: "attended", half: "am", timeIn: new Date("2026-09-18T08:00:00Z"), timeOut: new Date("2026-09-18T09:00:00Z") }],
      penalties: [],
      payments: [],
    });

    // "attended" has a stored session and no penalty, so nothing owed.
    expect(ledger.students.get("attended")).toMatchObject({ total: 0, outstanding: 0 });
    // "no-show" has no stored session rows at all — computeLedger must still
    // synthesize its missing-session entry and outstanding balance.
    expect(ledger.students.get("no-show")).toMatchObject({ total: 50, outstanding: 50 });
    expect(ledger.students.get("no-show")!.sessions).toHaveLength(1);
    expect(ledger.students.size).toBe(2);
  });

  it("treats a voided Payment as unpaid and excludes it from collected totals", () => {
    const ledger = computeLedger({
      campusDate: "2026-09-19", semesterEndDate: "2026-12-31",
      events: [{ id: "event", name: "Assembly", date: "2026-09-18", type: "half_day", halfDayPenaltyAmount: "50.00" }],
      students: [{ id: "student", createdAt: new Date("2026-01-01T00:00:00Z") }],
      sessions: [{ id: "session", eventId: "event", studentId: "student", half: "am", timeIn: null, timeOut: null }],
      penalties: [{ id: "penalty", attendanceSessionId: "session", studentId: "student", amount: "50.00" }],
      payments: [{ penaltyId: "penalty", amount: "50.00", voidedAt: new Date("2026-09-19T00:00:00Z") }],
    });

    expect(ledger.students.get("student")).toMatchObject({ total: 50, outstanding: 50 });
    expect(ledger.students.get("student")!.sessions[0].paid).toBe(false);
    expect(ledger.events[0].collected).toBe(0);
    expect(ledger.totals.collected).toBe(0);
  });
});
