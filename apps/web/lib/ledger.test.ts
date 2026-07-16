import { describe, expect, it } from "vitest";
import {
  computeEventGrid,
  computeLedger,
  type EventGridInput,
  missingHalves,
  owedHalves,
  type LedgerInput,
} from "./ledger";

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

// Registration date well before every Semester end so the per-Semester
// liability boundary never excludes this Student unless a test opts in.
const EARLY = new Date("2020-01-01T00:00:00Z");

function base(): LedgerInput {
  // Far-future Semester end so no Student is excluded by default; tests that
  // exercise the boundary set their own semesterEndDate.
  return {
    semesterEndDate: "2099-12-31",
    events: [],
    students: [],
    sessions: [],
    penalties: [],
    payments: [],
  };
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

  it("charges a late registrant for an Event before their registration (same Semester)", () => {
    const input = base();
    input.semesterEndDate = "2024-05-31";
    input.events.push({
      id: "e1",
      name: "Before I registered",
      date: "2024-03-10",
      type: "whole_day",
      halfDayPenaltyAmount: "50.00",
    });
    // Registered mid-Semester, after the Event — still owes (department rule).
    input.students.push({ id: "s1", createdAt: new Date("2024-03-11T00:00:00Z") });

    const ledger = computeLedger(input);
    expect(ledger.students.get("s1")!.total).toBe(100);
    expect(ledger.students.get("s1")!.sessions).toHaveLength(2);
    expect(ledger.events[0]).toMatchObject({ present: 0, absent: 2 });
  });

  it("excludes a Student who registered after the Semester ended", () => {
    const input = base();
    input.semesterEndDate = "2024-05-31";
    input.events.push({
      id: "e1",
      name: "A Semester I was never in",
      date: "2024-03-10",
      type: "whole_day",
      halfDayPenaltyAmount: "50.00",
    });
    // Account created after this Semester closed — owes nothing for it.
    input.students.push({ id: "s1", createdAt: new Date("2024-06-01T00:00:00Z") });

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

describe("computeEventGrid", () => {
  const t = new Date("2024-03-10T08:00:00Z");

  function gridBase(): EventGridInput {
    return {
      eventType: "whole_day",
      students: [{ id: "s1", name: "Ana", studentId: "2024-1" }],
      sessions: [],
      penalties: [],
      payments: [],
    };
  }

  it("returns four cells for a whole-day Event, present only when the field is set", () => {
    const input = gridBase();
    // am fully present, pm a no-show (both fields null).
    input.sessions.push(
      { id: "am1", studentId: "s1", half: "am", timeIn: t, timeOut: t },
      { id: "pm1", studentId: "s1", half: "pm", timeIn: null, timeOut: null },
    );

    const [row] = computeEventGrid(input);
    expect(row.cells.map((c) => c.label)).toEqual(["AM In", "AM Out", "PM In", "PM Out"]);
    expect(row.cells.map((c) => c.present)).toEqual([true, true, false, false]);
    expect(row.cells.map((c) => c.field)).toEqual(["timeIn", "timeOut", "timeIn", "timeOut"]);
    expect(row.cells[0].sessionId).toBe("am1");
    expect(row.cells[2].sessionId).toBe("pm1");
  });

  it("returns two cells for a half-day Event using the Student's one session", () => {
    const input = gridBase();
    input.eventType = "half_day";
    input.sessions.push({ id: "pm1", studentId: "s1", half: "pm", timeIn: t, timeOut: null });

    const [row] = computeEventGrid(input);
    expect(row.cells.map((c) => c.label)).toEqual(["Time-in", "Time-out"]);
    expect(row.cells.map((c) => c.present)).toEqual([true, false]);
    expect(row.cells.every((c) => c.sessionId === "pm1")).toBe(true);
  });

  it("a half only reads fully attended when both In and Out are present", () => {
    const input = gridBase();
    // am present, pm has an In but no Out — its half is not fully attended.
    input.sessions.push(
      { id: "am1", studentId: "s1", half: "am", timeIn: t, timeOut: t },
      { id: "pm1", studentId: "s1", half: "pm", timeIn: t, timeOut: null },
    );
    // The absent pm half carries a Penalty (as the write path would create).
    input.penalties.push({ id: "p1", attendanceSessionId: "pm1", amount: "50.00" });

    const [row] = computeEventGrid(input);
    // In present, Out absent — the half is not complete.
    expect(row.cells[2].present).toBe(true);
    expect(row.cells[3].present).toBe(false);
    expect(row.outstanding).toBe(50);
    expect(row.unpaidPenaltyIds).toEqual(["p1"]);
    expect(row.settled).toBe(false);
  });

  it("sums the Student's unpaid Penalties for this Event as outstanding", () => {
    const input = gridBase();
    input.sessions.push(
      { id: "am1", studentId: "s1", half: "am", timeIn: null, timeOut: null },
      { id: "pm1", studentId: "s1", half: "pm", timeIn: null, timeOut: null },
    );
    input.penalties.push(
      { id: "p1", attendanceSessionId: "am1", amount: "50.00" },
      { id: "p2", attendanceSessionId: "pm1", amount: "50.00" },
    );

    const [row] = computeEventGrid(input);
    expect(row.outstanding).toBe(100);
    expect(row.unpaidPenaltyIds.sort()).toEqual(["p1", "p2"]);
    expect(row.settled).toBe(false);
  });

  it("marks a row settled when every Penalty is paid; outstanding drops to 0", () => {
    const input = gridBase();
    input.sessions.push(
      { id: "am1", studentId: "s1", half: "am", timeIn: null, timeOut: null },
      { id: "pm1", studentId: "s1", half: "pm", timeIn: null, timeOut: null },
    );
    input.penalties.push(
      { id: "p1", attendanceSessionId: "am1", amount: "50.00" },
      { id: "p2", attendanceSessionId: "pm1", amount: "50.00" },
    );
    input.payments.push({ penaltyId: "p1" }, { penaltyId: "p2" });

    const [row] = computeEventGrid(input);
    expect(row.outstanding).toBe(0);
    expect(row.unpaidPenaltyIds).toEqual([]);
    expect(row.settled).toBe(true);
  });

  it("a fully present Student owes nothing and is not marked settled", () => {
    const input = gridBase();
    input.sessions.push(
      { id: "am1", studentId: "s1", half: "am", timeIn: t, timeOut: t },
      { id: "pm1", studentId: "s1", half: "pm", timeIn: t, timeOut: t },
    );

    const [row] = computeEventGrid(input);
    expect(row.outstanding).toBe(0);
    expect(row.settled).toBe(false);
  });

  it("returns one row per Student, carrying name and Student ID", () => {
    const input = gridBase();
    input.students.push({ id: "s2", name: "Ben", studentId: "2024-2" });
    input.sessions.push(
      { id: "am1", studentId: "s1", half: "am", timeIn: t, timeOut: t },
      { id: "pm1", studentId: "s1", half: "pm", timeIn: t, timeOut: t },
      { id: "am2", studentId: "s2", half: "am", timeIn: null, timeOut: null },
      { id: "pm2", studentId: "s2", half: "pm", timeIn: null, timeOut: null },
    );

    const rows = computeEventGrid(input);
    expect(rows.map((r) => r.name)).toEqual(["Ana", "Ben"]);
    expect(rows.map((r) => r.studentIdText)).toEqual(["2024-1", "2024-2"]);
  });
});
