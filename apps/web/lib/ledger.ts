import { attendanceSessions, events, payments, penalties, semesters, students } from "@attendance/db";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "./db";
import type { EventType } from "./events";
import { isSessionAbsent } from "./scan";

type Half = "am" | "pm";
export type EventStatus = "upcoming" | "today" | "past";
type LedgerSessionStatus = "present" | "incomplete" | "absent";

function attendanceStatus(
  eventStatus: EventStatus,
  present: boolean,
): LedgerSessionStatus {
  return present ? "present" : eventStatus === "today" ? "incomplete" : "absent";
}

export function currentCampusDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

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
  // Explicit so the pure projection never depends on the server's clock or
  // timezone. DB wrappers pass the current Asia/Manila calendar date.
  campusDate: string;
  // The end date (YYYY-MM-DD) of the Semester these Events belong to. A Student
  // owes for every Event in a Semester they registered into — including Events
  // before their registration — but nothing for a Semester that ended before
  // their account existed (ADR 0008). This is the single liability boundary.
  semesterEndDate: string;
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
  status: LedgerSessionStatus;
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
  date: string;
  type: EventType;
  status: EventStatus;
  sessions: {
    label: "AM" | "PM" | "Session";
    present: number;
    incomplete: number;
    absent: number;
  }[];
  present: number;
  incomplete: number;
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
// projections: per-Student standing (My Attendance, Clearance) and per-Event
// operations stats (Dashboard). No writes — loading a page never mutates
// shared state.
export function computeLedger(input: LedgerInput): Ledger {
  const { campusDate, semesterEndDate, events, students, sessions, penalties, payments } =
    input;

  const eventById = new Map(events.map((e) => [e.id, e]));
  const statusByEventId = new Map(
    events.map((event) => [
      event.id,
      event.date > campusDate
        ? ("upcoming" as const)
        : event.date === campusDate
          ? ("today" as const)
          : ("past" as const),
    ]),
  );
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

    const eventStatus = statusByEventId.get(sess.eventId)!;
    if (eventStatus === "upcoming") continue;
    const status = attendanceStatus(eventStatus, !absent);

    const penalty = penaltyBySession.get(sess.id);
    standingFor(sess.studentId).sessions.push({
      eventId: sess.eventId,
      eventName: event.name,
      eventDate: event.date,
      half: sess.half,
      timeIn: sess.timeIn,
      timeOut: sess.timeOut,
      status,
      amount: penalty ? Number(penalty.amount) : 0,
      paid: penalty ? paidPenaltyIds.has(penalty.id) : false,
    });
  }

  // Virtual no-shows: halves a registered Student owes that have no real row.
  for (const event of events) {
    const eventStatus = statusByEventId.get(event.id)!;
    if (eventStatus === "upcoming") continue;
    const rate = Number(event.halfDayPenaltyAmount);
    for (const student of students) {
      // Liability is per-Semester, not per-Event: a Student owes for every
      // Event in a Semester they belong to (late registration still owes for
      // earlier Events), and nothing for a Semester that ended before they
      // registered. See ADR 0008.
      if (student.createdAt.toISOString().slice(0, 10) > semesterEndDate) continue;
      const key = `${event.id}:${student.id}`;
      const existing = existingHalves.get(key) ?? new Set<Half>();
      const completed = completedByKey.get(key) ?? { am: false, pm: false };
      for (const half of owedHalves(event.type, completed, existing)) {
        const status = attendanceStatus(eventStatus, false);
        standingFor(student.id).sessions.push({
          eventId: event.id,
          eventName: event.name,
          eventDate: event.date,
          half,
          timeIn: null,
          timeOut: null,
          status,
          amount: rate,
          paid: false,
        });
      }
    }
  }

  // Collected: a Payment maps to its Event via Penalty → Session → Event.
  const collectedByEvent = new Map<string, number>();
  for (const pay of payments) {
    const penalty = penaltyById.get(pay.penaltyId);
    const sess = penalty && sessionById.get(penalty.attendanceSessionId);
    if (sess && statusByEventId.get(sess.eventId) !== "upcoming") {
      collectedByEvent.set(
        sess.eventId,
        (collectedByEvent.get(sess.eventId) ?? 0) + Number(pay.amount),
      );
    }
  }

  for (const standing of standings.values()) {
    standing.sessions.sort((a, b) => a.eventDate.localeCompare(b.eventDate));
    standing.total = standing.sessions.reduce((sum, s) => sum + s.amount, 0);
    standing.outstanding = standing.sessions.reduce(
      (sum, s) => sum + (s.paid ? 0 : s.amount),
      0,
    );
  }

  const eventsOut: EventStats[] = events
    .map((event) => {
      const status = statusByEventId.get(event.id)!;
      const eventSessions: EventStats["sessions"] =
        status === "upcoming"
          ? []
          : event.type === "whole_day"
            ? [
                { label: "AM", present: 0, incomplete: 0, absent: 0 },
                { label: "PM", present: 0, incomplete: 0, absent: 0 },
              ]
            : [{ label: "Session", present: 0, incomplete: 0, absent: 0 }];

      if (status !== "upcoming") {
        for (const student of students) {
          if (student.createdAt.toISOString().slice(0, 10) > semesterEndDate) continue;
          const completed = completedByKey.get(`${event.id}:${student.id}`) ?? {
            am: false,
            pm: false,
          };
          if (event.type === "half_day") {
            eventSessions[0][attendanceStatus(status, completed.am || completed.pm)]++;
          } else {
            eventSessions[0][attendanceStatus(status, completed.am)]++;
            eventSessions[1][attendanceStatus(status, completed.pm)]++;
          }
        }
      }

      const present = eventSessions.reduce((sum, session) => sum + session.present, 0);
      const incomplete = eventSessions.reduce((sum, session) => sum + session.incomplete, 0);
      const absent = eventSessions.reduce((sum, session) => sum + session.absent, 0);
      const resolved = present + absent;
      return {
        eventId: event.id,
        date: event.date,
        type: event.type,
        status,
        sessions: eventSessions,
        present,
        incomplete,
        absent,
        rate: resolved > 0 ? (present / resolved) * 100 : 0,
        collected: collectedByEvent.get(event.id) ?? 0,
      };
    })
    .sort((a, b) => {
      const rank = { today: 0, upcoming: 1, past: 2 };
      const byStatus = rank[a.status] - rank[b.status];
      if (byStatus !== 0) return byStatus;
      const byDate = a.status === "past"
        ? b.date.localeCompare(a.date)
        : a.date.localeCompare(b.date);
      return byDate || a.eventId.localeCompare(b.eventId);
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

// Already-loaded rows for one Event's roster. computeEventGrid does no DB
// access — the page loads these (after materializeEventNoShows, so every
// liable Student already has real session rows) and delegates here.
export type EventGridInput = {
  eventType: EventType;
  students: { id: string; name: string; studentId: string }[];
  sessions: {
    id: string;
    studentId: string;
    half: Half;
    timeIn: Date | null;
    timeOut: Date | null;
  }[];
  penalties: { id: string; attendanceSessionId: string; amount: string }[];
  payments: { penaltyId: string }[];
};

// One scan field of the grid. Present iff the field is set; each cell maps to
// exactly one (Attendance Session, timeIn|timeOut) the write path can toggle.
export type EventGridCell = {
  label: string;
  sessionId: string;
  field: "timeIn" | "timeOut";
  present: boolean;
};

export type EventGridRow = {
  studentId: string;
  name: string;
  studentIdText: string;
  cells: EventGridCell[]; // 4 for whole_day (AM/PM × In/Out), 2 for half_day
  outstanding: number; // unpaid Penalties for this Event
  unpaidPenaltyIds: string[];
  settled: boolean; // had Penalties, all paid → row reads "Paid"
};

function cellFor(
  label: string,
  session: EventGridInput["sessions"][number] | undefined,
  field: "timeIn" | "timeOut",
): EventGridCell {
  return {
    label,
    sessionId: session?.id ?? "",
    field,
    present: !!session?.[field],
  };
}

// Pivots one Event's rows to one row per Student: the scan cells (Present iff
// the field is set), the outstanding balance for this Event, and the unpaid
// Penalty ids the "Mark paid" button settles. Pure — same style as
// computeLedger; the both-scans-attended rule is surfaced by each cell's
// present flag, the money rule by the Penalty/Payment rows passed in.
export function computeEventGrid(input: EventGridInput): EventGridRow[] {
  const { eventType, students, sessions, penalties, payments } = input;
  const paidPenaltyIds = new Set(payments.map((p) => p.penaltyId));

  const sessionByStudentHalf = new Map<string, EventGridInput["sessions"][number]>();
  const sessionIdsByStudent = new Map<string, string[]>();
  for (const s of sessions) {
    sessionByStudentHalf.set(`${s.studentId}:${s.half}`, s);
    (sessionIdsByStudent.get(s.studentId) ??
      sessionIdsByStudent.set(s.studentId, []).get(s.studentId)!).push(s.id);
  }
  const penaltyBySession = new Map(penalties.map((p) => [p.attendanceSessionId, p]));

  return students.map((student) => {
    const am = sessionByStudentHalf.get(`${student.id}:am`);
    const pm = sessionByStudentHalf.get(`${student.id}:pm`);
    const cells =
      eventType === "half_day"
        ? [cellFor("Time-in", am ?? pm, "timeIn"), cellFor("Time-out", am ?? pm, "timeOut")]
        : [
            cellFor("AM In", am, "timeIn"),
            cellFor("AM Out", am, "timeOut"),
            cellFor("PM In", pm, "timeIn"),
            cellFor("PM Out", pm, "timeOut"),
          ];

    let penaltyCount = 0;
    let outstanding = 0;
    const unpaidPenaltyIds: string[] = [];
    for (const sessionId of sessionIdsByStudent.get(student.id) ?? []) {
      const penalty = penaltyBySession.get(sessionId);
      if (!penalty) continue;
      penaltyCount++;
      if (!paidPenaltyIds.has(penalty.id)) {
        outstanding += Number(penalty.amount);
        unpaidPenaltyIds.push(penalty.id);
      }
    }

    return {
      studentId: student.id,
      name: student.name,
      studentIdText: student.studentId,
      cells,
      outstanding,
      unpaidPenaltyIds,
      settled: penaltyCount > 0 && unpaidPenaltyIds.length === 0,
    };
  });
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
export async function materializeEventNoShows(
  eventId: string,
  campusDate = currentCampusDate(),
): Promise<void> {
  const event = await db.query.events.findFirst({ where: eq(events.id, eventId) });
  if (!event || event.date > campusDate) return;
  const semester = await db.query.semesters.findFirst({
    where: eq(semesters.id, event.semesterId),
  });
  if (!semester) return;

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
    // Same per-Semester liability boundary as computeLedger (ADR 0008).
    if (student.createdAt.toISOString().slice(0, 10) > semester.endDate) continue;
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
  venue: events.venue,
  type: events.type,
  halfDayPenaltyAmount: events.halfDayPenaltyAmount,
};

// One Student's Ledger standing for a Semester — total, outstanding, and the
// full session breakdown including virtual no-shows. Reads only; delegates to
// computeLedger. Consumed by My Attendance and Clearance (per matched
// Student). Empty when the Student or Semester's Events don't exist.
export async function studentLedger(
  semesterId: string,
  studentId: string,
  campusDate = currentCampusDate(),
): Promise<StudentStanding> {
  const empty: StudentStanding = { total: 0, outstanding: 0, sessions: [] };

  const [student, semester, eventRows] = await Promise.all([
    db.query.students.findFirst({ where: eq(students.id, studentId) }),
    db.query.semesters.findFirst({ where: eq(semesters.id, semesterId) }),
    db.select(eventCols).from(events).where(eq(events.semesterId, semesterId)),
  ]);
  if (!student || !semester || eventRows.length === 0) return empty;

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
    campusDate,
    semesterEndDate: semester.endDate,
    events: eventRows,
    students: [{ id: student.id, createdAt: student.createdAt }],
    sessions: sessionRows,
    penalties: penaltyRows,
    payments: paymentRows,
  });
  return ledger.students.get(studentId) ?? empty;
}

export type SemesterLedgerEvent = EventStats & { name: string; venue: string | null };

// Per-Event present/absent/rate/collected plus Semester totals, no-show-
// inclusive. Rolls up every Event in the Semester — there is no per-Officer
// scope since every Officer shares all Events (ADR 0007). Reads only;
// delegates to computeLedger. Consumed by Dashboard.
export async function semesterLedger(
  semesterId: string,
  campusDate = currentCampusDate(),
): Promise<{ events: SemesterLedgerEvent[]; totals: Ledger["totals"] }> {
  const [semester, eventRows, studentRows] = await Promise.all([
    db.query.semesters.findFirst({ where: eq(semesters.id, semesterId) }),
    db.select(eventCols).from(events).where(eq(events.semesterId, semesterId)),
    db.select({ id: students.id, createdAt: students.createdAt }).from(students),
  ]);

  const eventIds = eventRows.map((e) => e.id);
  if (!semester || eventIds.length === 0) {
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
    campusDate,
    semesterEndDate: semester.endDate,
    events: eventRows,
    students: studentRows,
    sessions: sessionRows,
    penalties: penaltyRows,
    payments: paymentRows,
  });

  const eventById = new Map(eventRows.map((event) => [event.id, event]));
  return {
    events: ledger.events.map((event) => ({
      ...event,
      name: eventById.get(event.eventId)!.name,
      venue: eventById.get(event.eventId)!.venue,
    })),
    totals: ledger.totals,
  };
}
