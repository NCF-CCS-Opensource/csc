import { attendanceSessions, events, payments, penalties, students } from "@attendance/db";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "./db";
import type { EventType } from "./events";
import { isSessionAbsent } from "./scan";

type Half = "am" | "pm";

// The absences a Student owes for one Event: expected halves minus the ones
// they actually *completed* (both Time-in and Time-out). Pure so it's unit-
// tested — the money rule lives here, the single place the no-show rule lives.
//
// whole_day expects am + pm; half_day expects one. For half_day we can't know
// which half it was (the Event doesn't record it), so a total no-show is
// charged as "am" — the amount is 1x either way. A half_day attendee who
// completed *either* half owes nothing.
export function missingHalves(
  type: EventType,
  completed: { am: boolean; pm: boolean },
): Half[] {
  if (type === "half_day") {
    return completed.am || completed.pm ? [] : ["am"];
  }
  const out: Half[] = [];
  if (!completed.am) out.push("am");
  if (!completed.pm) out.push("pm");
  return out;
}

// The halves a Student owes a virtual (unrecorded) no-show for: the missing
// halves, minus any that already have a real Attendance Session row. The
// single place the no-double-count rule lives — shared by the virtual read
// (computeLedger) and the write (materializeEventNoShows) so they can't drift.
//
// A half already on file (even incomplete) is priced by the write path, so it's
// excluded here. For half_day, any real row is the Student's one attempt —
// never charge the other half on top of it.
export function owedHalves(
  type: EventType,
  completed: { am: boolean; pm: boolean },
  existing: Set<Half>,
): Half[] {
  if (type === "half_day" && existing.size > 0) return [];
  return missingHalves(type, completed).filter((half) => !existing.has(half));
}

// Already-loaded, Semester-scoped in-memory rows. computeLedger does no DB
// access — the DB wrappers (studentLedger / semesterLedger) load these and
// delegate here so the no-show rule is exercised in exactly one place.
export type LedgerInput = {
  events: {
    id: string;
    name: string;
    date: string; // YYYY-MM-DD
    type: EventType;
    halfDayPenaltyAmount: string;
  }[];
  students: { id: string; createdAt: Date }[];
  sessions: {
    id: string;
    eventId: string;
    studentId: string;
    half: Half;
    timeIn: Date | null;
    timeOut: Date | null;
  }[];
  penalties: {
    id: string;
    attendanceSessionId: string;
    studentId: string;
    amount: string;
  }[];
  payments: { penaltyId: string; amount: string }[];
};

// One row of a Student's attendance history — a real Attendance Session or a
// virtual no-show (timeIn/timeOut null, absent, unpaid). amount is the Penalty
// for that half; 0 when present.
export type LedgerSession = {
  eventId: string;
  eventName: string;
  eventDate: string;
  half: Half;
  timeIn: Date | null;
  timeOut: Date | null;
  absent: boolean;
  amount: number;
  paid: boolean;
};

export type StudentStanding = {
  total: number;
  outstanding: number;
  sessions: LedgerSession[];
};

export type EventStats = {
  eventId: string;
  present: number;
  absent: number;
  rate: number;
  collected: number;
};

export type Ledger = {
  students: Map<string, StudentStanding>;
  events: EventStats[];
  totals: { present: number; absent: number; rate: number; collected: number };
};

// Unions real Attendance Sessions with virtual no-shows and returns both
// projections: per-Student standing (dashboard, Clearance) and per-Event stats
// (Analytics). No writes — loading a page never mutates shared state.
export function computeLedger(input: LedgerInput): Ledger {
  const { events, students, sessions, penalties, payments } = input;

  const eventById = new Map(events.map((e) => [e.id, e]));
  const sessionById = new Map(sessions.map((s) => [s.id, s]));
  const penaltyById = new Map(penalties.map((p) => [p.id, p]));
  const penaltyBySession = new Map(penalties.map((p) => [p.attendanceSessionId, p]));
  const paidPenaltyIds = new Set(payments.map((p) => p.penaltyId));

  const standings = new Map<string, StudentStanding>();
  for (const s of students) {
    standings.set(s.id, { total: 0, outstanding: 0, sessions: [] });
  }
  const standingFor = (studentId: string): StudentStanding => {
    let standing = standings.get(studentId);
    if (!standing) {
      standing = { total: 0, outstanding: 0, sessions: [] };
      standings.set(studentId, standing);
    }
    return standing;
  };

  const eventStats = new Map<string, { present: number; absent: number; collected: number }>();
  for (const e of events) eventStats.set(e.id, { present: 0, absent: 0, collected: 0 });

  // Real rows first — record present/absent, the halves already on file (so a
  // virtual no-show is never double-counted), and which halves were completed.
  const existingHalves = new Map<string, Set<Half>>();
  const completedByKey = new Map<string, { am: boolean; pm: boolean }>();
  for (const sess of sessions) {
    const event = eventById.get(sess.eventId);
    if (!event) continue;
    const key = `${sess.eventId}:${sess.studentId}`;
    (existingHalves.get(key) ?? existingHalves.set(key, new Set()).get(key)!).add(sess.half);
    const completed = completedByKey.get(key) ?? { am: false, pm: false };
    const absent = isSessionAbsent(sess);
    if (!absent) completed[sess.half] = true;
    completedByKey.set(key, completed);

    const stat = eventStats.get(sess.eventId)!;
    if (absent) stat.absent++;
    else stat.present++;

    const penalty = penaltyBySession.get(sess.id);
    standingFor(sess.studentId).sessions.push({
      eventId: sess.eventId,
      eventName: event.name,
      eventDate: event.date,
      half: sess.half,
      timeIn: sess.timeIn,
      timeOut: sess.timeOut,
      absent,
      amount: penalty ? Number(penalty.amount) : 0,
      paid: penalty ? paidPenaltyIds.has(penalty.id) : false,
    });
  }

  // Virtual no-shows: halves a registered Student owes that have no real row.
  for (const event of events) {
    const rate = Number(event.halfDayPenaltyAmount);
    for (const student of students) {
      // A Student can't owe for an Event that predates their registration.
      if (student.createdAt.toISOString().slice(0, 10) > event.date) continue;
      const key = `${event.id}:${student.id}`;
      const existing = existingHalves.get(key) ?? new Set<Half>();
      const completed = completedByKey.get(key) ?? { am: false, pm: false };
      for (const half of owedHalves(event.type, completed, existing)) {
        eventStats.get(event.id)!.absent++;
        standingFor(student.id).sessions.push({
          eventId: event.id,
          eventName: event.name,
          eventDate: event.date,
          half,
          timeIn: null,
          timeOut: null,
          absent: true,
          amount: rate,
          paid: false,
        });
      }
    }
  }

  // Collected: a Payment maps to its Event via Penalty → Session → Event.
  for (const pay of payments) {
    const penalty = penaltyById.get(pay.penaltyId);
    const sess = penalty && sessionById.get(penalty.attendanceSessionId);
    const stat = sess && eventStats.get(sess.eventId);
    if (stat) stat.collected += Number(pay.amount);
  }

  for (const standing of standings.values()) {
    standing.sessions.sort((a, b) => a.eventDate.localeCompare(b.eventDate));
    standing.total = standing.sessions.reduce((sum, s) => sum + s.amount, 0);
    standing.outstanding = standing.sessions.reduce(
      (sum, s) => sum + (s.paid ? 0 : s.amount),
      0,
    );
  }

  const eventsOut: EventStats[] = events.map((e) => {
    const st = eventStats.get(e.id)!;
    const total = st.present + st.absent;
    return {
      eventId: e.id,
      present: st.present,
      absent: st.absent,
      rate: total > 0 ? (st.present / total) * 100 : 0,
      collected: st.collected,
    };
  });
  const present = eventsOut.reduce((sum, e) => sum + e.present, 0);
  const absent = eventsOut.reduce((sum, e) => sum + e.absent, 0);
  const collected = eventsOut.reduce((sum, e) => sum + e.collected, 0);
  const totalHalves = present + absent;

  return {
    students: standings,
    events: eventsOut,
    totals: {
      present,
      absent,
      rate: totalHalves > 0 ? (present / totalHalves) * 100 : 0,
      collected,
    },
  };
}

// Writes real absent Attendance Session + Penalty rows for every Student who
// no-showed one Event, so an Officer opening the Event's attendance table can
// see the no-show and record a Payment (a Payment must reference a real
// Penalty row). Scoped to the one Event — reads compute no-shows virtually via
// computeLedger; this materializes only at the surface that needs payable rows.
//
// Idempotent: the unique (eventId, studentId, half) constraint plus
// onConflictDoNothing means a repeated or concurrent run inserts each row at
// most once. Uses the same no-double-count rule as computeLedger.
export async function materializeEventNoShows(eventId: string): Promise<void> {
  const event = await db.query.events.findFirst({ where: eq(events.id, eventId) });
  if (!event) return;

  const [allStudents, existing] = await Promise.all([
    db.select({ id: students.id, createdAt: students.createdAt }).from(students),
    db
      .select({
        studentId: attendanceSessions.studentId,
        half: attendanceSessions.half,
        timeIn: attendanceSessions.timeIn,
        timeOut: attendanceSessions.timeOut,
      })
      .from(attendanceSessions)
      .where(eq(attendanceSessions.eventId, eventId)),
  ]);

  const existingHalves = new Map<string, Set<Half>>();
  const completedBy = new Map<string, { am: boolean; pm: boolean }>();
  for (const row of existing) {
    (existingHalves.get(row.studentId) ??
      existingHalves.set(row.studentId, new Set()).get(row.studentId)!).add(row.half);
    const completed = completedBy.get(row.studentId) ?? { am: false, pm: false };
    if (!isSessionAbsent(row)) completed[row.half] = true;
    completedBy.set(row.studentId, completed);
  }

  const toInsert: { eventId: string; studentId: string; half: Half }[] = [];
  for (const student of allStudents) {
    if (student.createdAt.toISOString().slice(0, 10) > event.date) continue;
    const seen = existingHalves.get(student.id) ?? new Set<Half>();
    const completed = completedBy.get(student.id) ?? { am: false, pm: false };
    for (const half of owedHalves(event.type, completed, seen)) {
      toInsert.push({ eventId, studentId: student.id, half });
    }
  }
  if (toInsert.length === 0) return;

  const insertedSessions = await db
    .insert(attendanceSessions)
    .values(toInsert)
    .onConflictDoNothing()
    .returning({ id: attendanceSessions.id, studentId: attendanceSessions.studentId });
  if (insertedSessions.length === 0) return;

  await db
    .insert(penalties)
    .values(
      insertedSessions.map((s) => ({
        attendanceSessionId: s.id,
        studentId: s.studentId,
        amount: event.halfDayPenaltyAmount,
      })),
    )
    .onConflictDoNothing();
}

const eventCols = {
  id: events.id,
  name: events.name,
  date: events.date,
  type: events.type,
  halfDayPenaltyAmount: events.halfDayPenaltyAmount,
};

// One Student's Ledger standing for a Semester — total, outstanding, and the
// full session breakdown including virtual no-shows. Reads only; delegates to
// computeLedger. Consumed by the dashboard and by Clearance (per matched
// Student). Empty when the Student or Semester's Events don't exist.
export async function studentLedger(
  semesterId: string,
  studentId: string,
): Promise<StudentStanding> {
  const empty: StudentStanding = { total: 0, outstanding: 0, sessions: [] };

  const [student, eventRows] = await Promise.all([
    db.query.students.findFirst({ where: eq(students.id, studentId) }),
    db.select(eventCols).from(events).where(eq(events.semesterId, semesterId)),
  ]);
  if (!student || eventRows.length === 0) return empty;

  const eventIds = eventRows.map((e) => e.id);
  const sessionRows = await db
    .select({
      id: attendanceSessions.id,
      eventId: attendanceSessions.eventId,
      studentId: attendanceSessions.studentId,
      half: attendanceSessions.half,
      timeIn: attendanceSessions.timeIn,
      timeOut: attendanceSessions.timeOut,
    })
    .from(attendanceSessions)
    .where(
      and(
        eq(attendanceSessions.studentId, studentId),
        inArray(attendanceSessions.eventId, eventIds),
      ),
    );

  const sessionIds = sessionRows.map((s) => s.id);
  const penaltyRows =
    sessionIds.length > 0
      ? await db
          .select({
            id: penalties.id,
            attendanceSessionId: penalties.attendanceSessionId,
            studentId: penalties.studentId,
            amount: penalties.amount,
          })
          .from(penalties)
          .where(inArray(penalties.attendanceSessionId, sessionIds))
      : [];
  const penaltyIds = penaltyRows.map((p) => p.id);
  const paymentRows =
    penaltyIds.length > 0
      ? await db
          .select({ penaltyId: payments.penaltyId, amount: payments.amount })
          .from(payments)
          .where(inArray(payments.penaltyId, penaltyIds))
      : [];

  const ledger = computeLedger({
    events: eventRows,
    students: [{ id: student.id, createdAt: student.createdAt }],
    sessions: sessionRows,
    penalties: penaltyRows,
    payments: paymentRows,
  });
  return ledger.students.get(studentId) ?? empty;
}

export type SemesterLedgerScope = "all" | { officerId: string };

export type SemesterLedgerEvent = EventStats & { name: string };

// Per-Event present/absent/rate/collected plus Semester totals, no-show-
// inclusive. Governor scope ("all") rolls up every Officer's Events; an
// Officer scope limits to their own. Reads only; delegates to computeLedger.
// Consumed by Analytics.
export async function semesterLedger(
  semesterId: string,
  scope: SemesterLedgerScope,
): Promise<{ events: SemesterLedgerEvent[]; totals: Ledger["totals"] }> {
  const where =
    scope === "all"
      ? eq(events.semesterId, semesterId)
      : and(eq(events.semesterId, semesterId), eq(events.officerId, scope.officerId));

  const [eventRows, studentRows] = await Promise.all([
    db.select(eventCols).from(events).where(where),
    db.select({ id: students.id, createdAt: students.createdAt }).from(students),
  ]);

  const eventIds = eventRows.map((e) => e.id);
  if (eventIds.length === 0) {
    return { events: [], totals: { present: 0, absent: 0, rate: 0, collected: 0 } };
  }

  const sessionRows = await db
    .select({
      id: attendanceSessions.id,
      eventId: attendanceSessions.eventId,
      studentId: attendanceSessions.studentId,
      half: attendanceSessions.half,
      timeIn: attendanceSessions.timeIn,
      timeOut: attendanceSessions.timeOut,
    })
    .from(attendanceSessions)
    .where(inArray(attendanceSessions.eventId, eventIds));

  const penaltyRows = await db
    .select({
      id: penalties.id,
      attendanceSessionId: penalties.attendanceSessionId,
      studentId: penalties.studentId,
      amount: penalties.amount,
    })
    .from(penalties)
    .innerJoin(
      attendanceSessions,
      eq(penalties.attendanceSessionId, attendanceSessions.id),
    )
    .where(inArray(attendanceSessions.eventId, eventIds));

  const penaltyIds = penaltyRows.map((p) => p.id);
  const paymentRows =
    penaltyIds.length > 0
      ? await db
          .select({ penaltyId: payments.penaltyId, amount: payments.amount })
          .from(payments)
          .where(inArray(payments.penaltyId, penaltyIds))
      : [];

  const ledger = computeLedger({
    events: eventRows,
    students: studentRows,
    sessions: sessionRows,
    penalties: penaltyRows,
    payments: paymentRows,
  });

  const nameById = new Map(eventRows.map((e) => [e.id, e.name]));
  return {
    events: ledger.events.map((e) => ({ ...e, name: nameById.get(e.eventId)! })),
    totals: ledger.totals,
  };
}
