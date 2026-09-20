import type {
  FinancialEventBreakdown,
  FinancialOutstandingBalance,
  FinancialPaymentLogSummary,
  FinancialProgramBreakdown,
  FinancialReportData,
  Half,
  PerEventReportData,
  PerSemesterReportData,
  PerStudentReportData,
  SessionStatus,
  StudentEventBreakdown,
  StudentReportDetail,
} from "@attendance/contracts";

type EventType = "half_day" | "whole_day";
type SessionLike = { id: string; timeIn: Date | null; timeOut: Date | null };
type HalfCounts = { present: number; incomplete: number; absent: number };

function currentCampusDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

// A per-Event Report is available only the day after the Event date (spec #168).
export function isEventPastInManila(eventDate: string, now?: Date | string): boolean {
  const campusDate = typeof now === "string" ? now : currentCampusDate(now);
  return eventDate < campusDate;
}

const isSessionAbsent = (session: { timeIn: Date | null; timeOut: Date | null }) =>
  !session.timeIn || !session.timeOut;

function deriveHalfStatus(sess: SessionLike | undefined): SessionStatus {
  if (!sess) return "absent";
  if (!isSessionAbsent(sess)) return "present";
  return "incomplete";
}

function tallyHalf(status: SessionStatus, counts: HalfCounts): void {
  if (status === "present") counts.present++;
  else if (status === "incomplete") counts.incomplete++;
  else counts.absent++;
}

// half_day events reduce AM/PM to a single half (whichever session exists);
// whole_day events resolve each half independently.
function resolveEventHalfStatuses(
  eventType: EventType,
  amSess: SessionLike | undefined,
  pmSess: SessionLike | undefined,
): { amStatus: SessionStatus; pmStatus: SessionStatus } {
  if (eventType === "half_day") {
    return { amStatus: deriveHalfStatus(amSess ?? pmSess), pmStatus: "absent" };
  }
  return { amStatus: deriveHalfStatus(amSess), pmStatus: deriveHalfStatus(pmSess) };
}

// A recorded Penalty for the session wins; otherwise an absent half owes the
// event's flat per-half rate.
function eventHalfPenalty(
  sess: SessionLike | undefined,
  status: SessionStatus,
  penaltyRate: number,
  penaltyBySession: Map<string, number>,
): number {
  if (sess && penaltyBySession.has(sess.id)) return penaltyBySession.get(sess.id)!;
  return status === "absent" ? penaltyRate : 0;
}

export type PerEventReportInput = {
  event: PerEventReportData["event"];
  students: { id: string; name: string; studentId: string; program: string }[];
  sessions: { id: string; studentId: string; half: Half; timeIn: Date | null; timeOut: Date | null }[];
  penalties: { id: string; attendanceSessionId: string; studentId: string; amount: string }[];
  programs: string[];
};

export function computePerEventReport(input: PerEventReportInput): PerEventReportData {
  const { event, students, sessions, penalties, programs } = input;
  const penaltyRate = Number(event.halfDayPenaltyAmount);

  const sessionByStudentHalf = new Map<string, SessionLike>();
  for (const s of sessions) {
    sessionByStudentHalf.set(`${s.studentId}:${s.half}`, s);
  }

  const penaltyBySession = new Map<string, number>();
  for (const p of penalties) {
    penaltyBySession.set(p.attendanceSessionId, Number(p.amount));
  }

  const studentDetails: StudentReportDetail[] = [];
  const programMap = new Map<string, { totalStudents: number } & HalfCounts>();
  for (const prog of programs) {
    programMap.set(prog, { totalStudents: 0, present: 0, incomplete: 0, absent: 0 });
  }

  const totals: HalfCounts = { present: 0, incomplete: 0, absent: 0 };
  const amBreakdown: HalfCounts = { present: 0, incomplete: 0, absent: 0 };
  const pmBreakdown: HalfCounts = { present: 0, incomplete: 0, absent: 0 };
  let totalPenalties = 0;

  for (const student of students) {
    const progData = programMap.get(student.program) ?? { totalStudents: 0, present: 0, incomplete: 0, absent: 0 };
    progData.totalStudents++;

    const amSess = sessionByStudentHalf.get(`${student.id}:am`);
    const pmSess = sessionByStudentHalf.get(`${student.id}:pm`);
    const { amStatus, pmStatus } = resolveEventHalfStatuses(event.type, amSess, pmSess);

    tallyHalf(amStatus, totals);
    tallyHalf(amStatus, progData);
    if (event.type === "whole_day") {
      tallyHalf(amStatus, amBreakdown);
      tallyHalf(pmStatus, totals);
      tallyHalf(pmStatus, progData);
      tallyHalf(pmStatus, pmBreakdown);
    }

    const studentPenalty =
      eventHalfPenalty(amSess, amStatus, penaltyRate, penaltyBySession) +
      (event.type === "whole_day" ? eventHalfPenalty(pmSess, pmStatus, penaltyRate, penaltyBySession) : 0);
    totalPenalties += studentPenalty;

    studentDetails.push({
      studentId: student.studentId,
      name: student.name,
      program: student.program,
      amStatus,
      pmStatus,
      penaltyAmount: studentPenalty,
    });

    programMap.set(student.program, progData);
  }

  studentDetails.sort((a, b) => a.name.localeCompare(b.name));

  const totalResolved = totals.present + totals.absent;
  const attendanceRate = totalResolved > 0 ? (totals.present / totalResolved) * 100 : 0;

  const programBreakdowns = Array.from(programMap.entries()).map(([prog, stats]) => {
    const resolved = stats.present + stats.absent;
    return {
      program: prog,
      totalStudents: stats.totalStudents,
      presentHalves: stats.present,
      incompleteHalves: stats.incomplete,
      absentHalves: stats.absent,
      rate: resolved > 0 ? (stats.present / resolved) * 100 : 0,
    };
  });

  return {
    event,
    summary: {
      totalStudents: students.length,
      presentHalves: totals.present,
      incompleteHalves: totals.incomplete,
      absentHalves: totals.absent,
      attendanceRate,
      ...(event.type === "whole_day" ? { amBreakdown, pmBreakdown } : {}),
    },
    programBreakdowns,
    studentDetails,
    totalPenalties,
  };
}

export type PerStudentReportInput = {
  student: PerStudentReportData["student"];
  semesterName: string;
  events: { id: string; name: string; date: string; type: EventType; halfDayPenaltyAmount: string }[];
  sessions: { id: string; eventId: string; half: Half; timeIn: Date | null; timeOut: Date | null }[];
  penalties: { id: string; attendanceSessionId: string | null; studentId: string; amount: string }[];
  payments: { id: string; penaltyId: string; amount: string }[];
  asOfTimestamp: string;
};

// eventHalfPenalty's "one flat rate per absent half" folds a whole_day event's
// AM+PM penalty into a single sum here since neither half is charged twice.
function studentEventBreakdown(
  ev: PerStudentReportInput["events"][number],
  sessionsByEventHalf: Map<string, SessionLike>,
  penaltyBySession: Map<string, number>,
  attendance: { attended: number; absent: number },
): StudentEventBreakdown {
  const penaltyRate = Number(ev.halfDayPenaltyAmount);
  const amSess = sessionsByEventHalf.get(`${ev.id}:am`);
  const pmSess = sessionsByEventHalf.get(`${ev.id}:pm`);
  const { amStatus, pmStatus } = resolveEventHalfStatuses(ev.type, amSess, pmSess);

  const tally = (status: SessionStatus) => {
    if (status === "present") attendance.attended++;
    else attendance.absent++;
  };

  let eventPenalty: number;
  if (ev.type === "half_day") {
    tally(amStatus);
    eventPenalty = eventHalfPenalty(amSess ?? pmSess, amStatus, penaltyRate, penaltyBySession);
  } else {
    tally(amStatus);
    tally(pmStatus);
    eventPenalty =
      eventHalfPenalty(amSess, amStatus, penaltyRate, penaltyBySession) +
      eventHalfPenalty(pmSess, pmStatus, penaltyRate, penaltyBySession);
  }

  return {
    eventId: ev.id,
    eventName: ev.name,
    date: ev.date,
    amStatus,
    pmStatus,
    penaltyAmount: eventPenalty,
    paymentStatus: eventPenalty === 0 ? "NONE" : "UNPAID",
  };
}

export function computePerStudentReport(input: PerStudentReportInput): PerStudentReportData {
  const { student, semesterName, events, sessions, penalties, payments, asOfTimestamp } = input;

  const sessionsByEventHalf = new Map<string, SessionLike>();
  for (const s of sessions) {
    sessionsByEventHalf.set(`${s.eventId}:${s.half}`, s);
  }

  const penaltyBySession = new Map<string, number>();
  for (const p of penalties) {
    if (p.attendanceSessionId) {
      penaltyBySession.set(p.attendanceSessionId, Number(p.amount));
    }
  }

  const attendance = { attended: 0, absent: 0 };
  const eventsBreakdown = events.map((ev) =>
    studentEventBreakdown(ev, sessionsByEventHalf, penaltyBySession, attendance),
  );

  const totalPenaltiesCharged = penalties.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalPaymentsMade = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const outstandingBalance = Math.max(0, totalPenaltiesCharged - totalPaymentsMade);

  const clearanceStatus =
    outstandingBalance === 0
      ? "CLEARED"
      : `NOT CLEARED — Outstanding balance: ₱${outstandingBalance.toFixed(2)}`;

  const resolved = attendance.attended + attendance.absent;
  const attendanceRate = resolved > 0 ? (attendance.attended / resolved) * 100 : 0;

  return {
    student,
    semesterName,
    asOfTimestamp,
    standing: {
      totalEvents: events.length,
      sessionsAttended: attendance.attended,
      sessionsAbsent: attendance.absent,
      attendanceRate,
      totalPenaltiesCharged,
      totalPaymentsMade,
      outstandingBalance,
    },
    clearanceStatus,
    eventsBreakdown,
  };
}

export type PerSemesterReportInput = {
  semester: PerSemesterReportData["semester"];
  students: { id: string; name: string; studentId: string; program: string }[];
  events: { id: string; name: string; date: string; type: EventType; halfDayPenaltyAmount: string }[];
  sessions: { id: string; eventId: string; studentId: string; half: Half; timeIn: Date | null; timeOut: Date | null }[];
  penalties: { id: string; attendanceSessionId: string | null; studentId: string; amount: string }[];
  payments: { id: string; penaltyId: string; amount: string }[];
  programs: string[];
  asOfTimestamp: string;
};

// half_day counts a single attended half if either recorded session isn't
// absent; whole_day counts each half independently (0, 1, or 2).
function attendedHalvesForStudentEvent(
  sessionSet: Set<string>,
  studentId: string,
  ev: { id: string; type: EventType },
): number {
  const amAttended = sessionSet.has(`${studentId}:${ev.id}:am`);
  const pmAttended = sessionSet.has(`${studentId}:${ev.id}:pm`);
  if (ev.type === "half_day") {
    return amAttended || pmAttended ? 1 : 0;
  }
  return (amAttended ? 1 : 0) + (pmAttended ? 1 : 0);
}

export function computePerSemesterReport(input: PerSemesterReportInput): PerSemesterReportData {
  const { semester, students, events, sessions, penalties, payments, programs, asOfTimestamp } = input;

  const totalPenaltiesCharged = penalties.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalOutstanding = Math.max(0, totalPenaltiesCharged - totalCollected);

  const studentPenaltiesMap = new Map<string, number>();
  for (const p of penalties) {
    studentPenaltiesMap.set(p.studentId, (studentPenaltiesMap.get(p.studentId) ?? 0) + Number(p.amount));
  }

  const penaltyToStudentMap = new Map<string, string>();
  for (const p of penalties) {
    penaltyToStudentMap.set(p.id, p.studentId);
  }

  const studentPaymentsMap = new Map<string, number>();
  for (const pay of payments) {
    const studentId = penaltyToStudentMap.get(pay.penaltyId);
    if (studentId) {
      studentPaymentsMap.set(studentId, (studentPaymentsMap.get(studentId) ?? 0) + Number(pay.amount));
    }
  }

  const sessionByStudentEventHalf = new Set<string>();
  for (const s of sessions) {
    if (!isSessionAbsent(s)) {
      sessionByStudentEventHalf.add(`${s.studentId}:${s.eventId}:${s.half}`);
    }
  }

  let totalAttended = 0;
  let totalResolvedHalves = 0;

  const progMap = new Map<
    string,
    { studentCount: number; attendedHalves: number; resolvedHalves: number; penalties: number; paid: number }
  >();
  for (const p of programs) {
    progMap.set(p, { studentCount: 0, attendedHalves: 0, resolvedHalves: 0, penalties: 0, paid: 0 });
  }

  const clearanceMap = new Map<string, { cleared: number; notCleared: number }>();
  for (const p of programs) {
    clearanceMap.set(p, { cleared: 0, notCleared: 0 });
  }

  for (const st of students) {
    const progData = progMap.get(st.program) ?? { studentCount: 0, attendedHalves: 0, resolvedHalves: 0, penalties: 0, paid: 0 };
    progData.studentCount++;

    const stPenalties = studentPenaltiesMap.get(st.id) ?? 0;
    const stPayments = studentPaymentsMap.get(st.id) ?? 0;
    progData.penalties += stPenalties;
    progData.paid += stPayments;

    const cData = clearanceMap.get(st.program) ?? { cleared: 0, notCleared: 0 };
    if (Math.max(0, stPenalties - stPayments) === 0) {
      cData.cleared++;
    } else {
      cData.notCleared++;
    }
    clearanceMap.set(st.program, cData);

    for (const ev of events) {
      const halvesCount = ev.type === "whole_day" ? 2 : 1;
      progData.resolvedHalves += halvesCount;
      totalResolvedHalves += halvesCount;

      const attendedHalves = attendedHalvesForStudentEvent(sessionByStudentEventHalf, st.id, ev);
      progData.attendedHalves += attendedHalves;
      totalAttended += attendedHalves;
    }

    progMap.set(st.program, progData);
  }

  const overallAttendanceRate = totalResolvedHalves > 0 ? (totalAttended / totalResolvedHalves) * 100 : 0;

  const programBreakdown = Array.from(progMap.entries()).map(([prog, stats]) => ({
    program: prog,
    studentCount: stats.studentCount,
    attendanceRate: stats.resolvedHalves > 0 ? (stats.attendedHalves / stats.resolvedHalves) * 100 : 0,
    totalPenalties: stats.penalties,
    totalPaid: stats.paid,
    outstanding: Math.max(0, stats.penalties - stats.paid),
  }));

  const eventSummary = events.map((ev) => {
    let evAttended = 0;
    for (const st of students) {
      evAttended += attendedHalvesForStudentEvent(sessionByStudentEventHalf, st.id, ev);
    }
    const evResolved = students.length * (ev.type === "whole_day" ? 2 : 1);
    const evPenalties = penalties
      .filter((p) => sessions.find((s) => s.id === p.attendanceSessionId)?.eventId === ev.id)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      id: ev.id,
      date: ev.date,
      name: ev.name,
      attendanceRate: evResolved > 0 ? (evAttended / evResolved) * 100 : 0,
      penaltiesGenerated: evPenalties,
    };
  });

  const clearanceReadiness = Array.from(clearanceMap.entries()).map(([prog, stats]) => ({
    program: prog,
    clearedCount: stats.cleared,
    notClearedCount: stats.notCleared,
  }));

  return {
    semester,
    asOfTimestamp,
    overall: {
      totalRegisteredStudents: students.length,
      totalEvents: events.length,
      overallAttendanceRate,
      totalPenaltiesCharged,
      totalCollected,
      totalOutstanding,
    },
    programBreakdown,
    eventSummary,
    clearanceReadiness,
  };
}

export type FinancialReportInput = {
  semester: FinancialReportData["semester"];
  students: { id: string; name: string; studentId: string; program: string }[];
  events: { id: string; name: string; date: string; type: EventType; halfDayPenaltyAmount: string }[];
  sessions: { id: string; eventId: string; studentId: string; half: Half; timeIn: Date | null; timeOut: Date | null }[];
  penalties: { id: string; attendanceSessionId: string | null; studentId: string; amount: string }[];
  payments: { id: string; penaltyId: string; amount: string; officerName?: string; createdAt?: Date }[];
  programs: string[];
  asOfTimestamp: string;
};

function mapPenaltyLookups(
  penalties: FinancialReportInput["penalties"],
  sessions: FinancialReportInput["sessions"],
): { penaltyToStudentMap: Map<string, string>; penaltyToEventMap: Map<string, string> } {
  const penaltyToStudentMap = new Map<string, string>();
  const penaltyToEventMap = new Map<string, string>();
  for (const p of penalties) {
    penaltyToStudentMap.set(p.id, p.studentId);
    if (p.attendanceSessionId) {
      const sess = sessions.find((s) => s.id === p.attendanceSessionId);
      if (sess) penaltyToEventMap.set(p.id, sess.eventId);
    }
  }
  return { penaltyToStudentMap, penaltyToEventMap };
}

function financialProgramBreakdown(
  students: FinancialReportInput["students"],
  penalties: FinancialReportInput["penalties"],
  payments: FinancialReportInput["payments"],
  programs: string[],
  penaltyToStudentMap: Map<string, string>,
): FinancialProgramBreakdown[] {
  const progMap = new Map<string, { penalties: number; collected: number }>();
  for (const pr of programs) progMap.set(pr, { penalties: 0, collected: 0 });

  const studentProgramMap = new Map<string, string>();
  for (const st of students) studentProgramMap.set(st.id, st.program);

  for (const p of penalties) {
    const prog = studentProgramMap.get(p.studentId);
    if (prog) {
      const prev = progMap.get(prog) ?? { penalties: 0, collected: 0 };
      prev.penalties += Number(p.amount);
      progMap.set(prog, prev);
    }
  }

  for (const pay of payments) {
    const studentId = penaltyToStudentMap.get(pay.penaltyId);
    const prog = studentId ? studentProgramMap.get(studentId) : undefined;
    if (prog) {
      const prev = progMap.get(prog) ?? { penalties: 0, collected: 0 };
      prev.collected += Number(pay.amount);
      progMap.set(prog, prev);
    }
  }

  return Array.from(progMap.entries()).map(([prog, stats]) => ({
    program: prog,
    totalPenalties: stats.penalties,
    totalCollected: stats.collected,
    outstanding: Math.max(0, stats.penalties - stats.collected),
    collectionRate: stats.penalties > 0 ? (stats.collected / stats.penalties) * 100 : 0,
  }));
}

function financialEventBreakdown(
  events: FinancialReportInput["events"],
  penalties: FinancialReportInput["penalties"],
  payments: FinancialReportInput["payments"],
  penaltyToEventMap: Map<string, string>,
): FinancialEventBreakdown[] {
  const eventPenaltiesMap = new Map<string, number>();
  const eventCollectedMap = new Map<string, number>();

  for (const p of penalties) {
    const eventId = penaltyToEventMap.get(p.id);
    if (eventId) eventPenaltiesMap.set(eventId, (eventPenaltiesMap.get(eventId) ?? 0) + Number(p.amount));
  }
  for (const pay of payments) {
    const eventId = penaltyToEventMap.get(pay.penaltyId);
    if (eventId) eventCollectedMap.set(eventId, (eventCollectedMap.get(eventId) ?? 0) + Number(pay.amount));
  }

  return events.map((ev) => {
    const pen = eventPenaltiesMap.get(ev.id) ?? 0;
    const col = eventCollectedMap.get(ev.id) ?? 0;
    return { id: ev.id, name: ev.name, penaltiesGenerated: pen, amountCollected: col, outstanding: Math.max(0, pen - col) };
  });
}

function financialOutstandingBalances(
  students: FinancialReportInput["students"],
  penalties: FinancialReportInput["penalties"],
  payments: FinancialReportInput["payments"],
  penaltyToStudentMap: Map<string, string>,
): FinancialOutstandingBalance[] {
  const studentPenaltiesSum = new Map<string, number>();
  for (const p of penalties) {
    studentPenaltiesSum.set(p.studentId, (studentPenaltiesSum.get(p.studentId) ?? 0) + Number(p.amount));
  }

  const studentPaymentsSum = new Map<string, number>();
  for (const pay of payments) {
    const stId = penaltyToStudentMap.get(pay.penaltyId);
    if (stId) studentPaymentsSum.set(stId, (studentPaymentsSum.get(stId) ?? 0) + Number(pay.amount));
  }

  const list: FinancialOutstandingBalance[] = [];
  for (const st of students) {
    const pen = studentPenaltiesSum.get(st.id) ?? 0;
    const pay = studentPaymentsSum.get(st.id) ?? 0;
    const owed = Math.max(0, pen - pay);
    if (owed > 0) list.push({ studentId: st.studentId, name: st.name, program: st.program, amountOwed: owed });
  }
  list.sort((a, b) => b.amountOwed - a.amountOwed);
  return list;
}

function financialPaymentLogSummary(
  payments: FinancialReportInput["payments"],
  semester: FinancialReportInput["semester"],
): FinancialPaymentLogSummary {
  const officersSet = new Set<string>();
  let minDate: Date | null = null;
  let maxDate: Date | null = null;

  for (const pay of payments) {
    if (pay.officerName) officersSet.add(pay.officerName);
    if (pay.createdAt) {
      if (!minDate || pay.createdAt < minDate) minDate = pay.createdAt;
      if (!maxDate || pay.createdAt > maxDate) maxDate = pay.createdAt;
    }
  }

  const dateRange =
    minDate && maxDate
      ? `${minDate.toISOString().slice(0, 10)} to ${maxDate.toISOString().slice(0, 10)}`
      : `${semester.startDate} to ${semester.endDate}`;

  return { totalTransactions: payments.length, dateRange, receivingOfficers: Array.from(officersSet) };
}

export function computeFinancialReport(input: FinancialReportInput): FinancialReportData {
  const { semester, students, events, sessions, penalties, payments, programs, asOfTimestamp } = input;

  const totalPenaltiesCharged = penalties.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalPaymentsCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalOutstandingBalance = Math.max(0, totalPenaltiesCharged - totalPaymentsCollected);
  const collectionRate = totalPenaltiesCharged > 0 ? (totalPaymentsCollected / totalPenaltiesCharged) * 100 : 0;

  const { penaltyToStudentMap, penaltyToEventMap } = mapPenaltyLookups(penalties, sessions);

  return {
    semester,
    asOfTimestamp,
    overview: {
      totalPenaltiesCharged,
      totalPaymentsCollected,
      totalOutstandingBalance,
      collectionRate,
    },
    programBreakdown: financialProgramBreakdown(students, penalties, payments, programs, penaltyToStudentMap),
    eventBreakdown: financialEventBreakdown(events, penalties, payments, penaltyToEventMap),
    outstandingBalancesList: financialOutstandingBalances(students, penalties, payments, penaltyToStudentMap),
    paymentLogSummary: financialPaymentLogSummary(payments, semester),
  };
}
