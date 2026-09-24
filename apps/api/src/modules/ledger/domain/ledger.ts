type Half = "am" | "pm";
type EventType = "half_day" | "whole_day";
export type EventStatus = "upcoming" | "today" | "past";
type SessionStatus = "present" | "incomplete" | "absent";

export type LedgerInput = {
  campusDate: string; semesterEndDate: string;
  events: { id: string; name: string; date: string; type: EventType; halfDayPenaltyAmount: string }[];
  students: { id: string; createdAt: Date }[];
  sessions: { id: string; eventId: string; studentId: string; half: Half; timeIn: Date | null; timeOut: Date | null }[];
  penalties: { id: string; attendanceSessionId: string; studentId: string; amount: string }[];
  // A voided Payment settles nothing: it is ignored everywhere below.
  payments: { penaltyId: string; amount: string; voidedAt?: Date | null }[];
  // Null for a Semester closed before SAF tracking began (ADR 0024): no SAF line.
  safFeeAmount: string | null;
  safFeePayments: { id: string; studentId: string; voidedAt?: Date | null }[];
};
export type LedgerSession = { eventId: string; eventName: string; eventDate: string; half: Half; timeIn: Date | null; timeOut: Date | null; status: SessionStatus; amount: number; paid: boolean };
// paymentId is the un-voided SAF Fee Payment, so the Clearance page can undo it.
export type SafLine = { amount: number; paid: boolean; paymentId: string | null };
export type StudentStanding = { total: number; outstanding: number; sessions: LedgerSession[]; saf: SafLine | null };
export type EventStats = { eventId: string; date: string; type: EventType; status: EventStatus; sessions: { label: "AM" | "PM" | "Session"; present: number; incomplete: number; absent: number }[]; present: number; incomplete: number; absent: number; rate: number; collected: number };
export type Ledger = { students: Map<string, StudentStanding>; events: EventStats[]; totals: { present: number; absent: number; rate: number; collected: number } };
export type EventGridInput = { eventType: EventType; students: { id: string; name: string; studentId: string }[]; sessions: { id: string; studentId: string; half: Half; timeIn: Date | null; timeOut: Date | null }[]; penalties: { id: string; attendanceSessionId: string; amount: string }[]; payments: { penaltyId: string }[] };
export type EventGridRow = { studentId: string; name: string; studentIdText: string; cells: { label: string; sessionId: string; field: "timeIn" | "timeOut"; present: boolean }[]; outstanding: number; unpaidPenaltyIds: string[]; settled: boolean };

export function currentCampusDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}
export function missingHalves(type: EventType, completed: { am: boolean; pm: boolean }): Half[] {
  if (type === "half_day") {
    return completed.am || completed.pm ? [] : ["am"];
  }
  return (["am", "pm"] as Half[]).filter((half) => !completed[half]);
}
export function owedHalves(type: EventType, completed: { am: boolean; pm: boolean }, existing: Set<Half>): Half[] { return type === "half_day" && existing.size ? [] : missingHalves(type, completed).filter((half) => !existing.has(half)); }
const absent = (session: { timeIn: Date | null; timeOut: Date | null }) => !session.timeIn || !session.timeOut;
const sessionStatus = (eventStatus: EventStatus, present: boolean): SessionStatus => {
  if (present) return "present";
  return eventStatus === "today" ? "incomplete" : "absent";
};
const eventStatusFor = (eventDate: string, campusDate: string): EventStatus => {
  if (eventDate > campusDate) return "upcoming";
  return eventDate === campusDate ? "today" : "past";
};
const isStudentLiable = (student: { createdAt: Date }, semesterEndDate: string) => student.createdAt.toISOString().slice(0, 10) <= semesterEndDate;

type LedgerContext = {
  eventById: Map<string, LedgerInput["events"][number]>;
  state: Map<string, EventStatus>;
  penaltyBySession: Map<string, LedgerInput["penalties"][number]>;
  penaltyById: Map<string, LedgerInput["penalties"][number]>;
  sessionById: Map<string, LedgerInput["sessions"][number]>;
  paid: Set<string>;
};

function buildContext(input: LedgerInput): LedgerContext {
  return {
    eventById: new Map(input.events.map((event) => [event.id, event])),
    state: new Map(input.events.map((event) => [event.id, eventStatusFor(event.date, input.campusDate)])),
    penaltyBySession: new Map(input.penalties.map((penalty) => [penalty.attendanceSessionId, penalty])),
    penaltyById: new Map(input.penalties.map((penalty) => [penalty.id, penalty])),
    sessionById: new Map(input.sessions.map((session) => [session.id, session])),
    paid: new Set(input.payments.map((payment) => payment.penaltyId)),
  };
}

function standingFor(students: Map<string, StudentStanding>, id: string): StudentStanding {
  const existing = students.get(id);
  if (existing) return existing;
  const created: StudentStanding = { total: 0, outstanding: 0, sessions: [], saf: null };
  students.set(id, created);
  return created;
}

function recordActualSessions(input: LedgerInput, context: LedgerContext, students: Map<string, StudentStanding>, halves: Map<string, Set<Half>>, completed: Map<string, { am: boolean; pm: boolean }>) {
  for (const session of input.sessions) {
    const event = context.eventById.get(session.eventId);
    if (!event) continue;

    const key = `${session.eventId}:${session.studentId}`;
    const halfSet = halves.get(key) ?? new Set<Half>();
    halfSet.add(session.half);
    halves.set(key, halfSet);

    const done = completed.get(key) ?? { am: false, pm: false };
    if (!absent(session)) {
      done[session.half] = true;
    }
    completed.set(key, done);

    const eventStatus = context.state.get(session.eventId)!;
    if (eventStatus === "upcoming") continue;

    const penalty = context.penaltyBySession.get(session.id);
    standingFor(students, session.studentId).sessions.push({
      eventId: session.eventId,
      eventName: event.name,
      eventDate: event.date,
      half: session.half,
      timeIn: session.timeIn,
      timeOut: session.timeOut,
      status: sessionStatus(eventStatus, !absent(session)),
      amount: penalty ? Number(penalty.amount) : 0,
      paid: penalty ? context.paid.has(penalty.id) : false,
    });
  }
}

function recordMissingSessions(input: LedgerInput, context: LedgerContext, students: Map<string, StudentStanding>, halves: Map<string, Set<Half>>, completed: Map<string, { am: boolean; pm: boolean }>) {
  for (const event of input.events) {
    const eventStatus = context.state.get(event.id)!;
    if (eventStatus === "upcoming") continue;

    for (const student of input.students) {
      if (!isStudentLiable(student, input.semesterEndDate)) continue;

      const key = `${event.id}:${student.id}`;
      const owed = owedHalves(event.type, completed.get(key) ?? { am: false, pm: false }, halves.get(key) ?? new Set());
      for (const half of owed) {
        standingFor(students, student.id).sessions.push({
          eventId: event.id,
          eventName: event.name,
          eventDate: event.date,
          half,
          timeIn: null,
          timeOut: null,
          status: sessionStatus(eventStatus, false),
          amount: Number(event.halfDayPenaltyAmount),
          paid: false,
        });
      }
    }
  }
}

// Every liable Student owes the full SAF Fee once per Semester, mid-Semester
// registrants included — see CONTEXT.md's SAF Fee entry.
function recordSafFees(input: LedgerInput, students: Map<string, StudentStanding>) {
  if (input.safFeeAmount === null) return;
  const paymentByStudent = new Map(input.safFeePayments.map((payment) => [payment.studentId, payment.id]));
  for (const student of input.students) {
    if (!isStudentLiable(student, input.semesterEndDate)) continue;
    const paymentId = paymentByStudent.get(student.id) ?? null;
    standingFor(students, student.id).saf = { amount: Number(input.safFeeAmount), paid: paymentId !== null, paymentId };
  }
}

function finalizeStudentTotals(students: Map<string, StudentStanding>) {
  for (const standing of students.values()) {
    standing.sessions.sort((a, b) => a.eventDate.localeCompare(b.eventDate));
    const saf = standing.saf?.amount ?? 0;
    standing.total = standing.sessions.reduce((sum, session) => sum + session.amount, saf);
    standing.outstanding = standing.sessions.reduce((sum, session) => sum + (session.paid ? 0 : session.amount), standing.saf?.paid ? 0 : saf);
  }
}

function buildCollectedByEvent(input: LedgerInput, context: LedgerContext): Map<string, number> {
  const collected = new Map<string, number>();
  for (const payment of input.payments) {
    const penalty = context.penaltyById.get(payment.penaltyId);
    const session = penalty && context.sessionById.get(penalty.attendanceSessionId);
    if (!session || context.state.get(session.eventId) === "upcoming") continue;
    collected.set(session.eventId, (collected.get(session.eventId) ?? 0) + Number(payment.amount));
  }
  return collected;
}

function buildEventSessionCounts(event: LedgerInput["events"][number], eventStatus: EventStatus, input: LedgerInput, completed: Map<string, { am: boolean; pm: boolean }>) {
  if (eventStatus === "upcoming") return [];

  const sessions =
    event.type === "whole_day"
      ? [
          { label: "AM" as const, present: 0, incomplete: 0, absent: 0 },
          { label: "PM" as const, present: 0, incomplete: 0, absent: 0 },
        ]
      : [{ label: "Session" as const, present: 0, incomplete: 0, absent: 0 }];

  for (const student of input.students) {
    if (!isStudentLiable(student, input.semesterEndDate)) continue;
    const done = completed.get(`${event.id}:${student.id}`) ?? { am: false, pm: false };
    if (event.type === "half_day") {
      sessions[0][sessionStatus(eventStatus, done.am || done.pm)]++;
    } else {
      sessions[0][sessionStatus(eventStatus, done.am)]++;
      sessions[1][sessionStatus(eventStatus, done.pm)]++;
    }
  }
  return sessions;
}

const EVENT_ORDER: Record<EventStatus, number> = { today: 0, upcoming: 1, past: 2 };

function compareEvents(a: EventStats, b: EventStats): number {
  const orderDiff = EVENT_ORDER[a.status] - EVENT_ORDER[b.status];
  if (orderDiff !== 0) return orderDiff;
  const dateDiff = a.status === "past" ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date);
  return dateDiff !== 0 ? dateDiff : a.eventId.localeCompare(b.eventId);
}

function buildEventStats(input: LedgerInput, context: LedgerContext, completed: Map<string, { am: boolean; pm: boolean }>, collected: Map<string, number>): EventStats[] {
  const events = input.events.map((event) => {
    const eventStatus = context.state.get(event.id)!;
    const sessions = buildEventSessionCounts(event, eventStatus, input, completed);
    const present = sessions.reduce((sum, item) => sum + item.present, 0);
    const incomplete = sessions.reduce((sum, item) => sum + item.incomplete, 0);
    const absentCount = sessions.reduce((sum, item) => sum + item.absent, 0);
    const resolved = present + absentCount;
    return {
      eventId: event.id,
      date: event.date,
      type: event.type,
      status: eventStatus,
      sessions,
      present,
      incomplete,
      absent: absentCount,
      rate: resolved ? (present / resolved) * 100 : 0,
      collected: collected.get(event.id) ?? 0,
    };
  });
  return events.sort(compareEvents);
}

export function computeLedger(ledgerInput: LedgerInput): Ledger {
  const input = { ...ledgerInput, payments: ledgerInput.payments.filter((payment) => !payment.voidedAt), safFeePayments: ledgerInput.safFeePayments.filter((payment) => !payment.voidedAt) };
  const context = buildContext(input);
  const students = new Map<string, StudentStanding>(input.students.map((student) => [student.id, { total: 0, outstanding: 0, sessions: [], saf: null }]));
  const halves = new Map<string, Set<Half>>();
  const completed = new Map<string, { am: boolean; pm: boolean }>();

  recordActualSessions(input, context, students, halves, completed);
  recordMissingSessions(input, context, students, halves, completed);
  recordSafFees(input, students);
  finalizeStudentTotals(students);

  const collected = buildCollectedByEvent(input, context);
  const events = buildEventStats(input, context, completed, collected);

  const present = events.reduce((sum, event) => sum + event.present, 0);
  const absentCount = events.reduce((sum, event) => sum + event.absent, 0);
  const totalCollected = events.reduce((sum, event) => sum + event.collected, 0);
  const resolved = present + absentCount;

  return {
    students,
    events,
    totals: { present, absent: absentCount, rate: resolved ? (present / resolved) * 100 : 0, collected: totalCollected },
  };
}

export function computeEventGrid(input: EventGridInput): EventGridRow[] {
  const paid = new Set(input.payments.map((payment) => payment.penaltyId));
  const byStudentHalf = new Map(input.sessions.map((session) => [`${session.studentId}:${session.half}`, session]));
  const penalties = new Map(input.penalties.map((penalty) => [penalty.attendanceSessionId, penalty]));
  const cell = (session: EventGridInput["sessions"][number] | undefined, label: string, field: "timeIn" | "timeOut") => ({ label, sessionId: session?.id ?? "", field, present: !!session?.[field] });
  return input.students.map((student) => {
    const own = input.sessions.filter((session) => session.studentId === student.id), am = byStudentHalf.get(`${student.id}:am`), pm = byStudentHalf.get(`${student.id}:pm`);
    const unpaidPenaltyIds = own.flatMap((session) => { const penalty = penalties.get(session.id); return penalty && !paid.has(penalty.id) ? [penalty.id] : []; });
    const outstanding = own.reduce((sum, session) => { const penalty = penalties.get(session.id); return penalty && !paid.has(penalty.id) ? sum + Number(penalty.amount) : sum; }, 0);
    return { studentId: student.id, name: student.name, studentIdText: student.studentId, cells: input.eventType === "half_day" ? [cell(am ?? pm, "Time-in", "timeIn"), cell(am ?? pm, "Time-out", "timeOut")] : [cell(am, "AM In", "timeIn"), cell(am, "AM Out", "timeOut"), cell(pm, "PM In", "timeIn"), cell(pm, "PM Out", "timeOut")], outstanding, unpaidPenaltyIds, settled: own.some((session) => penalties.has(session.id)) && !unpaidPenaltyIds.length };
  });
}
