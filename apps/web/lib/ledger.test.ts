import { describe, expect, it } from "vitest";
import { computeLedger, missingHalves, owedHalves, type LedgerInput } from "./ledger";

describe("owedHalves", () => {
  const none = new Set<"am" | "pm">();

  it("owes every missing half with no existing rows", () => {
    expect(owedHalves("whole_day", { am: false, pm: false }, none)).toEqual(["am", "pm"]);
  });

  it("skips a half already on file (no double-charge)", () => {
    const existing = new Set<"am" | "pm">(["am"]);
    expect(owedHalves("whole_day", { am: false, pm: false }, existing)).toEqual(["pm"]);
  });

  it("half_day with any existing row owes nothing more", () => {
    const existing = new Set<"am" | "pm">(["pm"]); // incomplete pm, priced already
    expect(owedHalves("half_day", { am: false, pm: false }, existing)).toEqual([]);
  });

  it("half_day no-show with no rows owes one", () => {
    expect(owedHalves("half_day", { am: false, pm: false }, none)).toEqual(["am"]);
  });
});

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

// Registration date well before every Event so prior-registration exclusion
// isn't in play unless a test opts in.
const EARLY = new Date("2020-01-01T00:00:00Z");

function base(): LedgerInput {
  return { events: [], students: [], sessions: [], penalties: [], payments: [] };
}

function present(id: string, eventId: string, studentId: string, half: "am" | "pm") {
  return {
    id,
    eventId,
    studentId,
    half,
    timeIn: new Date("2024-03-10T08:00:00Z"),
    timeOut: new Date("2024-03-10T12:00:00Z"),
  };
}

describe("computeLedger", () => {
  it("charges a full whole-day no-show on both projections", () => {
    const input = base();
    input.events.push({
      id: "e1",
      name: "Orientation",
      date: "2024-03-10",
      type: "whole_day",
      halfDayPenaltyAmount: "50.00",
    });
    input.students.push({ id: "s1", createdAt: EARLY });

    const ledger = computeLedger(input);
    const standing = ledger.students.get("s1")!;
    expect(standing.total).toBe(100); // both halves at 50
    expect(standing.outstanding).toBe(100);
    expect(standing.sessions.map((s) => s.half)).toEqual(["am", "pm"]);
    expect(standing.sessions.every((s) => s.absent && s.amount === 50)).toBe(true);

    const stats = ledger.events[0];
    expect(stats).toMatchObject({ present: 0, absent: 2, rate: 0 });
    expect(ledger.totals).toMatchObject({ present: 0, absent: 2 });
  });

  it("does not double-charge a half already on file (incomplete row)", () => {
    const input = base();
    input.events.push({
      id: "e1",
      name: "Seminar",
      date: "2024-03-10",
      type: "whole_day",
      halfDayPenaltyAmount: "50.00",
    });
    input.students.push({ id: "s1", createdAt: EARLY });
    // Incomplete am row (timeOut missing) already priced by the write path.
    input.sessions.push({
      id: "as1",
      eventId: "e1",
      studentId: "s1",
      half: "am",
      timeIn: new Date("2024-03-10T08:00:00Z"),
      timeOut: null,
    });
    input.penalties.push({
      id: "p1",
      attendanceSessionId: "as1",
      studentId: "s1",
      amount: "50.00",
    });

    const ledger = computeLedger(input);
    const standing = ledger.students.get("s1")!;
    // am from the real row + pm virtual = 100, not 150.
    expect(standing.total).toBe(100);
    expect(standing.sessions).toHaveLength(2);
    expect(ledger.events[0]).toMatchObject({ present: 0, absent: 2 });
  });

  it("half-day attendee of either half owes nothing", () => {
    const input = base();
    input.events.push({
      id: "e1",
      name: "Half day",
      date: "2024-03-10",
      type: "half_day",
      halfDayPenaltyAmount: "40.00",
    });
    input.students.push({ id: "s1", createdAt: EARLY });
    input.sessions.push(present("as1", "e1", "s1", "pm"));

    const ledger = computeLedger(input);
    const standing = ledger.students.get("s1")!;
    expect(standing.total).toBe(0);
    expect(standing.outstanding).toBe(0);
    expect(ledger.events[0]).toMatchObject({ present: 1, absent: 0, rate: 100 });
  });

  it("half-day with only an incomplete row is charged once, not twice", () => {
    const input = base();
    input.events.push({
      id: "e1",
      name: "Half day",
      date: "2024-03-10",
      type: "half_day",
      halfDayPenaltyAmount: "40.00",
    });
    input.students.push({ id: "s1", createdAt: EARLY });
    // Incomplete pm row — the write path priced it. No virtual "am" on top.
    input.sessions.push({
      id: "as1",
      eventId: "e1",
      studentId: "s1",
      half: "pm",
      timeIn: null,
      timeOut: new Date("2024-03-10T12:00:00Z"),
    });
    input.penalties.push({
      id: "p1",
      attendanceSessionId: "as1",
      studentId: "s1",
      amount: "40.00",
    });

    const ledger = computeLedger(input);
    const standing = ledger.students.get("s1")!;
    expect(standing.total).toBe(40);
    expect(standing.sessions).toHaveLength(1);
    expect(ledger.events[0]).toMatchObject({ present: 0, absent: 1 });
  });

  it("half-day no-show owes one at the Event's rate", () => {
    const input = base();
    input.events.push({
      id: "e1",
      name: "Half day",
      date: "2024-03-10",
      type: "half_day",
      halfDayPenaltyAmount: "40.00",
    });
    input.students.push({ id: "s1", createdAt: EARLY });

    const ledger = computeLedger(input);
    expect(ledger.students.get("s1")!.total).toBe(40);
    expect(ledger.events[0]).toMatchObject({ present: 0, absent: 1 });
  });

  it("excludes an Event that predates the Student's registration", () => {
    const input = base();
    input.events.push({
      id: "e1",
      name: "Before I registered",
      date: "2024-03-10",
      type: "whole_day",
      halfDayPenaltyAmount: "50.00",
    });
    input.students.push({ id: "s1", createdAt: new Date("2024-03-11T00:00:00Z") });

    const ledger = computeLedger(input);
    expect(ledger.students.get("s1")!.total).toBe(0);
    expect(ledger.students.get("s1")!.sessions).toHaveLength(0);
    expect(ledger.events[0]).toMatchObject({ present: 0, absent: 0 });
  });

  it("outstanding excludes paid Penalties; total includes them", () => {
    const input = base();
    input.events.push({
      id: "e1",
      name: "Whole day",
      date: "2024-03-10",
      type: "whole_day",
      halfDayPenaltyAmount: "50.00",
    });
    input.students.push({ id: "s1", createdAt: EARLY });
    // Real absent am row with a paid Penalty; pm is a virtual no-show (unpaid).
    input.sessions.push({
      id: "as1",
      eventId: "e1",
      studentId: "s1",
      half: "am",
      timeIn: null,
      timeOut: null,
    });
    input.penalties.push({
      id: "p1",
      attendanceSessionId: "as1",
      studentId: "s1",
      amount: "50.00",
    });
    input.payments.push({ penaltyId: "p1", amount: "50.00" });

    const ledger = computeLedger(input);
    const standing = ledger.students.get("s1")!;
    expect(standing.total).toBe(100); // paid am + unpaid pm
    expect(standing.outstanding).toBe(50); // only the unpaid pm
    expect(ledger.events[0].collected).toBe(50);
    expect(ledger.totals.collected).toBe(50);
  });

  it("sorts a Student's sessions by Event date", () => {
    const input = base();
    input.events.push(
      {
        id: "late",
        name: "Later",
        date: "2024-03-20",
        type: "half_day",
        halfDayPenaltyAmount: "10.00",
      },
      {
        id: "early",
        name: "Earlier",
        date: "2024-03-01",
        type: "half_day",
        halfDayPenaltyAmount: "10.00",
      },
    );
    input.students.push({ id: "s1", createdAt: EARLY });

    const ledger = computeLedger(input);
    expect(ledger.students.get("s1")!.sessions.map((s) => s.eventDate)).toEqual([
      "2024-03-01",
      "2024-03-20",
    ]);
  });

  it("returns empty projections when there are no Events", () => {
    const input = base();
    input.students.push({ id: "s1", createdAt: EARLY });
    const ledger = computeLedger(input);
    expect(ledger.events).toEqual([]);
    expect(ledger.totals).toEqual({ present: 0, absent: 0, rate: 0, collected: 0 });
    expect(ledger.students.get("s1")).toEqual({ total: 0, outstanding: 0, sessions: [] });
  });

  it("counts present halves toward the attendance rate", () => {
    const input = base();
    input.events.push({
      id: "e1",
      name: "Whole day",
      date: "2024-03-10",
      type: "whole_day",
      halfDayPenaltyAmount: "50.00",
    });
    input.students.push({ id: "s1", createdAt: EARLY });
    input.sessions.push(present("as1", "e1", "s1", "am")); // pm becomes virtual absent

    const ledger = computeLedger(input);
    expect(ledger.events[0]).toMatchObject({ present: 1, absent: 1, rate: 50 });
    expect(ledger.students.get("s1")!.total).toBe(50);
  });
});
