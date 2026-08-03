import type { EventType } from "./events";
import { currentCampusDate, missingHalves } from "./ledger";
import { isSessionAbsent } from "./scan";


export type Half = "am" | "pm";
export type SessionStatus = "present" | "incomplete" | "absent";

export function isEventPastInManila(eventDate: string, now?: Date | string): boolean {
  const campusDate = typeof now === "string" ? now : currentCampusDate(now);
  return eventDate < campusDate;
}

export type PerEventReportInput = {
  event: {
    id: string;
    name: string;
    date: string;
    venue: string | null;
    type: EventType;
    halfDayPenaltyAmount: string;
    semesterName: string;
  };
  students: {
    id: string;
    name: string;
    studentId: string;
    program: string;
  }[];
  sessions: {
    id: string;
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
  programs: string[];
};

export type StudentReportDetail = {
  studentId: string;
  name: string;
  program: string;
  amStatus: SessionStatus;
  pmStatus: SessionStatus;
  penaltyAmount: number;
};

export type ProgramBreakdown = {
  program: string;
  totalStudents: number;
  presentHalves: number;
  incompleteHalves: number;
  absentHalves: number;
  rate: number;
};

export type PerEventReportData = {
  event: PerEventReportInput["event"];
  summary: {
    totalStudents: number;
    presentHalves: number;
    incompleteHalves: number;
    absentHalves: number;
    attendanceRate: number;
    amBreakdown?: { present: number; incomplete: number; absent: number };
    pmBreakdown?: { present: number; incomplete: number; absent: number };
  };
  programBreakdowns: ProgramBreakdown[];
  studentDetails: StudentReportDetail[];
  totalPenalties: number;
  aiNarrative?: string | null;
};


export function computePerEventReport(input: PerEventReportInput): PerEventReportData {
  const { event, students, sessions, penalties, programs } = input;
  const penaltyRate = Number(event.halfDayPenaltyAmount);

  const sessionByStudentHalf = new Map<string, (typeof sessions)[number]>();
  for (const s of sessions) {
    sessionByStudentHalf.set(`${s.studentId}:${s.half}`, s);
  }

  const penaltyBySession = new Map<string, number>();
  for (const p of penalties) {
    penaltyBySession.set(p.attendanceSessionId, Number(p.amount));
  }

  const studentDetails: StudentReportDetail[] = [];
  const programMap = new Map<
    string,
    { totalStudents: number; presentHalves: number; incompleteHalves: number; absentHalves: number }
  >();

  for (const prog of programs) {
    programMap.set(prog, { totalStudents: 0, presentHalves: 0, incompleteHalves: 0, absentHalves: 0 });
  }

  let totalPresentHalves = 0;
  let totalIncompleteHalves = 0;
  let totalAbsentHalves = 0;
  let totalPenalties = 0;

  const amBreakdown = { present: 0, incomplete: 0, absent: 0 };
  const pmBreakdown = { present: 0, incomplete: 0, absent: 0 };

  for (const student of students) {
    const progData = programMap.get(student.program) ?? {
      totalStudents: 0,
      presentHalves: 0,
      incompleteHalves: 0,
      absentHalves: 0,
    };
    progData.totalStudents++;

    const amSess = sessionByStudentHalf.get(`${student.id}:am`);
    const pmSess = sessionByStudentHalf.get(`${student.id}:pm`);

    const deriveStatus = (sess: (typeof sessions)[number] | undefined): SessionStatus => {
      if (!sess) return "absent";
      if (!isSessionAbsent(sess)) return "present";
      return "incomplete";
    };

    let amStatus: SessionStatus = "absent";
    let pmStatus: SessionStatus = "absent";

    if (event.type === "half_day") {
      const halfSess = amSess ?? pmSess;
      const status = deriveStatus(halfSess);
      amStatus = status;
      pmStatus = "absent"; // N/A for half day

      if (status === "present") {
        totalPresentHalves++;
        progData.presentHalves++;
      } else if (status === "incomplete") {
        totalIncompleteHalves++;
        progData.incompleteHalves++;
      } else {
        totalAbsentHalves++;
        progData.absentHalves++;
      }
    } else {
      amStatus = deriveStatus(amSess);
      pmStatus = deriveStatus(pmSess);

      const trackHalf = (status: SessionStatus, breakdown: typeof amBreakdown) => {
        if (status === "present") {
          totalPresentHalves++;
          progData.presentHalves++;
          breakdown.present++;
        } else if (status === "incomplete") {
          totalIncompleteHalves++;
          progData.incompleteHalves++;
          breakdown.incomplete++;
        } else {
          totalAbsentHalves++;
          progData.absentHalves++;
          breakdown.absent++;
        }
      };

      trackHalf(amStatus, amBreakdown);
      trackHalf(pmStatus, pmBreakdown);
    }

    let studentPenalty = 0;
    if (amSess && penaltyBySession.has(amSess.id)) {
      studentPenalty += penaltyBySession.get(amSess.id)!;
    } else if (amStatus === "absent" && (event.type === "whole_day" || (event.type === "half_day" && !pmSess))) {
      studentPenalty += penaltyRate;
    }

    if (event.type === "whole_day") {
      if (pmSess && penaltyBySession.has(pmSess.id)) {
        studentPenalty += penaltyBySession.get(pmSess.id)!;
      } else if (pmStatus === "absent") {
        studentPenalty += penaltyRate;
      }
    }

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

  // Sort student details by name
  studentDetails.sort((a, b) => a.name.localeCompare(b.name));

  const totalResolved = totalPresentHalves + totalAbsentHalves;
  const attendanceRate = totalResolved > 0 ? (totalPresentHalves / totalResolved) * 100 : 0;

  const programBreakdowns: ProgramBreakdown[] = Array.from(programMap.entries()).map(
    ([prog, stats]) => {
      const resolved = stats.presentHalves + stats.absentHalves;
      return {
        program: prog,
        totalStudents: stats.totalStudents,
        presentHalves: stats.presentHalves,
        incompleteHalves: stats.incompleteHalves,
        absentHalves: stats.absentHalves,
        rate: resolved > 0 ? (stats.presentHalves / resolved) * 100 : 0,
      };
    },
  );

  return {
    event,
    summary: {
      totalStudents: students.length,
      presentHalves: totalPresentHalves,
      incompleteHalves: totalIncompleteHalves,
      absentHalves: totalAbsentHalves,
      attendanceRate,
      ...(event.type === "whole_day" ? { amBreakdown, pmBreakdown } : {}),
    },
    programBreakdowns,
    studentDetails,
    totalPenalties,
  };
}

export type StudentEventBreakdown = {
  eventId: string;
  eventName: string;
  date: string;
  amStatus: SessionStatus;
  pmStatus: SessionStatus;
  penaltyAmount: number;
  paymentStatus: "PAID" | "UNPAID" | "PARTIAL" | "NONE";
};

export type PerStudentReportInput = {
  student: {
    id: string;
    name: string;
    studentId: string;
    program: string;
  };
  semesterName: string;
  events: {
    id: string;
    name: string;
    date: string;
    type: EventType;
    halfDayPenaltyAmount: string;
  }[];
  sessions: {
    id: string;
    eventId: string;
    half: Half;
    timeIn: Date | null;
    timeOut: Date | null;
  }[];
  penalties: {
    id: string;
    attendanceSessionId: string | null;
    studentId: string;
    amount: string;
  }[];
  payments: {
    id: string;
    penaltyId: string;
    amount: string;
  }[];
  asOfTimestamp: string;
};

export type PerStudentReportData = {
  student: PerStudentReportInput["student"];
  semesterName: string;
  asOfTimestamp: string;
  standing: {
    totalEvents: number;
    sessionsAttended: number;
    sessionsAbsent: number;
    attendanceRate: number;
    totalPenaltiesCharged: number;
    totalPaymentsMade: number;
    outstandingBalance: number;
  };
  clearanceStatus: string;
  eventsBreakdown: StudentEventBreakdown[];
  aiNarrative?: string | null;
};

export function computePerStudentReport(input: PerStudentReportInput): PerStudentReportData {
  const { student, semesterName, events, sessions, penalties, payments, asOfTimestamp } = input;

  const sessionsByEventHalf = new Map<string, (typeof sessions)[number]>();
  for (const s of sessions) {
    sessionsByEventHalf.set(`${s.eventId}:${s.half}`, s);
  }

  const penaltyBySession = new Map<string, number>();
  for (const p of penalties) {
    if (p.attendanceSessionId) {
      penaltyBySession.set(p.attendanceSessionId, Number(p.amount));
    }
  }

  const paymentsByPenalty = new Map<string, number>();
  for (const pay of payments) {
    const prev = paymentsByPenalty.get(pay.penaltyId) ?? 0;
    paymentsByPenalty.set(pay.penaltyId, prev + Number(pay.amount));
  }

  let totalAttendedHalves = 0;
  let totalAbsentHalves = 0;
  let totalExpectedHalves = 0;

  const eventsBreakdown: StudentEventBreakdown[] = [];

  for (const ev of events) {
    const penaltyRate = Number(ev.halfDayPenaltyAmount);
    const amSess = sessionsByEventHalf.get(`${ev.id}:am`);
    const pmSess = sessionsByEventHalf.get(`${ev.id}:pm`);

    const deriveStatus = (sess: (typeof sessions)[number] | undefined): SessionStatus => {
      if (!sess) return "absent";
      if (!isSessionAbsent(sess)) return "present";
      return "incomplete";
    };

    let amStatus: SessionStatus = "absent";
    let pmStatus: SessionStatus = "absent";
    let eventPenalty = 0;

    if (ev.type === "half_day") {
      totalExpectedHalves += 1;
      const halfSess = amSess ?? pmSess;
      const status = deriveStatus(halfSess);
      amStatus = status;
      pmStatus = "absent";

      if (status === "present") totalAttendedHalves++;
      else totalAbsentHalves++;

      if (halfSess && penaltyBySession.has(halfSess.id)) {
        eventPenalty += penaltyBySession.get(halfSess.id)!;
      } else if (status === "absent") {
        eventPenalty += penaltyRate;
      }
    } else {
      totalExpectedHalves += 2;
      amStatus = deriveStatus(amSess);
      pmStatus = deriveStatus(pmSess);

      if (amStatus === "present") totalAttendedHalves++;
      else totalAbsentHalves++;

      if (pmStatus === "present") totalAttendedHalves++;
      else totalAbsentHalves++;

      if (amSess && penaltyBySession.has(amSess.id)) {
        eventPenalty += penaltyBySession.get(amSess.id)!;
      } else if (amStatus === "absent") {
        eventPenalty += penaltyRate;
      }

      if (pmSess && penaltyBySession.has(pmSess.id)) {
        eventPenalty += penaltyBySession.get(pmSess.id)!;
      } else if (pmStatus === "absent") {
        eventPenalty += penaltyRate;
      }
    }

    eventsBreakdown.push({
      eventId: ev.id,
      eventName: ev.name,
      date: ev.date,
      amStatus,
      pmStatus,
      penaltyAmount: eventPenalty,
      paymentStatus: eventPenalty === 0 ? "NONE" : "UNPAID",
    });
  }

  const totalPenaltiesCharged = penalties.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalPaymentsMade = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const outstandingBalance = Math.max(0, totalPenaltiesCharged - totalPaymentsMade);

  const clearanceStatus =
    outstandingBalance === 0
      ? "CLEARED"
      : `NOT CLEARED — Outstanding balance: ₱${outstandingBalance.toFixed(2)}`;

  const resolved = totalAttendedHalves + totalAbsentHalves;
  const attendanceRate = resolved > 0 ? (totalAttendedHalves / resolved) * 100 : 0;

  return {
    student,
    semesterName,
    asOfTimestamp,
    standing: {
      totalEvents: events.length,
      sessionsAttended: totalAttendedHalves,
      sessionsAbsent: totalAbsentHalves,
      attendanceRate,
      totalPenaltiesCharged,
      totalPaymentsMade,
      outstandingBalance,
    },
    clearanceStatus,
    eventsBreakdown,
  };
}

export type PerSemesterProgramBreakdown = {
  program: string;
  studentCount: number;
  attendanceRate: number;
  totalPenalties: number;
  totalPaid: number;
  outstanding: number;
};

export type PerSemesterEventSummary = {
  id: string;
  date: string;
  name: string;
  attendanceRate: number;
  penaltiesGenerated: number;
};

export type PerSemesterClearanceReadiness = {
  program: string;
  clearedCount: number;
  notClearedCount: number;
};

export type PerSemesterReportInput = {
  semester: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    closedAt: Date | null;
  };
  students: {
    id: string;
    name: string;
    studentId: string;
    program: string;
  }[];
  events: {
    id: string;
    name: string;
    date: string;
    type: EventType;
    halfDayPenaltyAmount: string;
  }[];
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
    attendanceSessionId: string | null;
    studentId: string;
    amount: string;
  }[];
  payments: {
    id: string;
    penaltyId: string;
    amount: string;
  }[];
  programs: string[];
  asOfTimestamp: string;
};

export type PerSemesterReportData = {
  semester: PerSemesterReportInput["semester"];
  asOfTimestamp: string;
  overall: {
    totalRegisteredStudents: number;
    totalEvents: number;
    overallAttendanceRate: number;
    totalPenaltiesCharged: number;
    totalCollected: number;
    totalOutstanding: number;
  };
  programBreakdown: PerSemesterProgramBreakdown[];
  eventSummary: PerSemesterEventSummary[];
  clearanceReadiness: PerSemesterClearanceReadiness[];
  aiNarrative?: string | null;
};

export function computePerSemesterReport(input: PerSemesterReportInput): PerSemesterReportData {
  const { semester, students, events, sessions, penalties, payments, programs, asOfTimestamp } = input;

  const totalPenaltiesCharged = penalties.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalOutstanding = Math.max(0, totalPenaltiesCharged - totalCollected);

  // Map student penalties and payments
  const studentPenaltiesMap = new Map<string, number>();
  for (const p of penalties) {
    const prev = studentPenaltiesMap.get(p.studentId) ?? 0;
    studentPenaltiesMap.set(p.studentId, prev + Number(p.amount));
  }

  const penaltyToStudentMap = new Map<string, string>();
  for (const p of penalties) {
    penaltyToStudentMap.set(p.id, p.studentId);
  }

  const studentPaymentsMap = new Map<string, number>();
  for (const pay of payments) {
    const studentId = penaltyToStudentMap.get(pay.penaltyId);
    if (studentId) {
      const prev = studentPaymentsMap.get(studentId) ?? 0;
      studentPaymentsMap.set(studentId, prev + Number(pay.amount));
    }
  }

  // Attendance sessions calculation
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

    const stBalance = Math.max(0, stPenalties - stPayments);
    const cData = clearanceMap.get(st.program) ?? { cleared: 0, notCleared: 0 };
    if (stBalance === 0) {
      cData.cleared++;
    } else {
      cData.notCleared++;
    }
    clearanceMap.set(st.program, cData);

    for (const ev of events) {
      const halvesCount = ev.type === "whole_day" ? 2 : 1;
      progData.resolvedHalves += halvesCount;
      totalResolvedHalves += halvesCount;

      if (ev.type === "half_day") {
        if (sessionByStudentEventHalf.has(`${st.id}:${ev.id}:am`) || sessionByStudentEventHalf.has(`${st.id}:${ev.id}:pm`)) {
          progData.attendedHalves++;
          totalAttended++;
        }
      } else {
        if (sessionByStudentEventHalf.has(`${st.id}:${ev.id}:am`)) {
          progData.attendedHalves++;
          totalAttended++;
        }
        if (sessionByStudentEventHalf.has(`${st.id}:${ev.id}:pm`)) {
          progData.attendedHalves++;
          totalAttended++;
        }
      }
    }

    progMap.set(st.program, progData);
  }

  const overallAttendanceRate = totalResolvedHalves > 0 ? (totalAttended / totalResolvedHalves) * 100 : 0;

  const programBreakdown: PerSemesterProgramBreakdown[] = Array.from(progMap.entries()).map(
    ([prog, stats]) => ({
      program: prog,
      studentCount: stats.studentCount,
      attendanceRate: stats.resolvedHalves > 0 ? (stats.attendedHalves / stats.resolvedHalves) * 100 : 0,
      totalPenalties: stats.penalties,
      totalPaid: stats.paid,
      outstanding: Math.max(0, stats.penalties - stats.paid),
    }),
  );

  const eventSummary: PerSemesterEventSummary[] = events.map((ev) => {
    let evAttended = 0;
    const evResolved = students.length * (ev.type === "whole_day" ? 2 : 1);
    for (const st of students) {
      if (ev.type === "half_day") {
        if (sessionByStudentEventHalf.has(`${st.id}:${ev.id}:am`) || sessionByStudentEventHalf.has(`${st.id}:${ev.id}:pm`)) {
          evAttended++;
        }
      } else {
        if (sessionByStudentEventHalf.has(`${st.id}:${ev.id}:am`)) evAttended++;
        if (sessionByStudentEventHalf.has(`${st.id}:${ev.id}:pm`)) evAttended++;
      }
    }
    const evPenalties = penalties
      .filter((p) => {
        const sess = sessions.find((s) => s.id === p.attendanceSessionId);
        return sess?.eventId === ev.id;
      })
      .reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      id: ev.id,
      date: ev.date,
      name: ev.name,
      attendanceRate: evResolved > 0 ? (evAttended / evResolved) * 100 : 0,
      penaltiesGenerated: evPenalties,
    };
  });

  const clearanceReadiness: PerSemesterClearanceReadiness[] = Array.from(clearanceMap.entries()).map(
    ([prog, stats]) => ({
      program: prog,
      clearedCount: stats.cleared,
      notClearedCount: stats.notCleared,
    }),
  );

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

export type FinancialProgramBreakdown = {
  program: string;
  totalPenalties: number;
  totalCollected: number;
  outstanding: number;
  collectionRate: number;
};

export type FinancialEventBreakdown = {
  id: string;
  name: string;
  penaltiesGenerated: number;
  amountCollected: number;
  outstanding: number;
};

export type FinancialOutstandingBalance = {
  studentId: string;
  name: string;
  program: string;
  amountOwed: number;
};

export type FinancialPaymentLogSummary = {
  totalTransactions: number;
  dateRange: string;
  receivingOfficers: string[];
};

export type FinancialReportInput = {
  semester: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    closedAt: Date | null;
  };
  students: {
    id: string;
    name: string;
    studentId: string;
    program: string;
  }[];
  events: {
    id: string;
    name: string;
    date: string;
    type: EventType;
    halfDayPenaltyAmount: string;
  }[];
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
    attendanceSessionId: string | null;
    studentId: string;
    amount: string;
  }[];
  payments: {
    id: string;
    penaltyId: string;
    amount: string;
    officerName?: string;
    createdAt?: Date;
  }[];
  programs: string[];
  asOfTimestamp: string;
};

export type FinancialReportData = {
  semester: FinancialReportInput["semester"];
  asOfTimestamp: string;
  overview: {
    totalPenaltiesCharged: number;
    totalPaymentsCollected: number;
    totalOutstandingBalance: number;
    collectionRate: number;
  };
  programBreakdown: FinancialProgramBreakdown[];
  eventBreakdown: FinancialEventBreakdown[];
  outstandingBalancesList: FinancialOutstandingBalance[];
  paymentLogSummary: FinancialPaymentLogSummary;
  aiNarrative?: string | null;
};

export function computeFinancialReport(input: FinancialReportInput): FinancialReportData {
  const { semester, students, events, sessions, penalties, payments, programs, asOfTimestamp } = input;

  const totalPenaltiesCharged = penalties.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalPaymentsCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalOutstandingBalance = Math.max(0, totalPenaltiesCharged - totalPaymentsCollected);
  const collectionRate = totalPenaltiesCharged > 0 ? (totalPaymentsCollected / totalPenaltiesCharged) * 100 : 0;

  const penaltyToStudentMap = new Map<string, string>();
  const penaltyToEventMap = new Map<string, string>();
  for (const p of penalties) {
    penaltyToStudentMap.set(p.id, p.studentId);
    if (p.attendanceSessionId) {
      const sess = sessions.find((s) => s.id === p.attendanceSessionId);
      if (sess) {
        penaltyToEventMap.set(p.id, sess.eventId);
      }
    }
  }

  // Program Breakdown
  const progMap = new Map<string, { penalties: number; collected: number }>();
  for (const pr of programs) {
    progMap.set(pr, { penalties: 0, collected: 0 });
  }

  const studentProgramMap = new Map<string, string>();
  for (const st of students) {
    studentProgramMap.set(st.id, st.program);
  }

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
    if (studentId) {
      const prog = studentProgramMap.get(studentId);
      if (prog) {
        const prev = progMap.get(prog) ?? { penalties: 0, collected: 0 };
        prev.collected += Number(pay.amount);
        progMap.set(prog, prev);
      }
    }
  }

  const programBreakdown: FinancialProgramBreakdown[] = Array.from(progMap.entries()).map(
    ([prog, stats]) => {
      const out = Math.max(0, stats.penalties - stats.collected);
      const rate = stats.penalties > 0 ? (stats.collected / stats.penalties) * 100 : 0;
      return {
        program: prog,
        totalPenalties: stats.penalties,
        totalCollected: stats.collected,
        outstanding: out,
        collectionRate: rate,
      };
    },
  );

  // Event Breakdown
  const eventPenaltiesMap = new Map<string, number>();
  const eventCollectedMap = new Map<string, number>();

  for (const p of penalties) {
    const eventId = penaltyToEventMap.get(p.id);
    if (eventId) {
      const prev = eventPenaltiesMap.get(eventId) ?? 0;
      eventPenaltiesMap.set(eventId, prev + Number(p.amount));
    }
  }

  for (const pay of payments) {
    const eventId = penaltyToEventMap.get(pay.penaltyId);
    if (eventId) {
      const prev = eventCollectedMap.get(eventId) ?? 0;
      eventCollectedMap.set(eventId, prev + Number(pay.amount));
    }
  }

  const eventBreakdown: FinancialEventBreakdown[] = events.map((ev) => {
    const pen = eventPenaltiesMap.get(ev.id) ?? 0;
    const col = eventCollectedMap.get(ev.id) ?? 0;
    return {
      id: ev.id,
      name: ev.name,
      penaltiesGenerated: pen,
      amountCollected: col,
      outstanding: Math.max(0, pen - col),
    };
  });

  // Outstanding Balances List
  const studentPenaltiesSum = new Map<string, number>();
  for (const p of penalties) {
    const prev = studentPenaltiesSum.get(p.studentId) ?? 0;
    studentPenaltiesSum.set(p.studentId, prev + Number(p.amount));
  }

  const studentPaymentsSum = new Map<string, number>();
  for (const pay of payments) {
    const stId = penaltyToStudentMap.get(pay.penaltyId);
    if (stId) {
      const prev = studentPaymentsSum.get(stId) ?? 0;
      studentPaymentsSum.set(stId, prev + Number(pay.amount));
    }
  }

  const outstandingBalancesList: FinancialOutstandingBalance[] = [];
  for (const st of students) {
    const pen = studentPenaltiesSum.get(st.id) ?? 0;
    const pay = studentPaymentsSum.get(st.id) ?? 0;
    const owed = Math.max(0, pen - pay);
    if (owed > 0) {
      outstandingBalancesList.push({
        studentId: st.studentId,
        name: st.name,
        program: st.program,
        amountOwed: owed,
      });
    }
  }
  outstandingBalancesList.sort((a, b) => b.amountOwed - a.amountOwed);

  // Payment Log Summary
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

  return {
    semester,
    asOfTimestamp,
    overview: {
      totalPenaltiesCharged,
      totalPaymentsCollected,
      totalOutstandingBalance,
      collectionRate,
    },
    programBreakdown,
    eventBreakdown,
    outstandingBalancesList,
    paymentLogSummary: {
      totalTransactions: payments.length,
      dateRange,
      receivingOfficers: Array.from(officersSet),
    },
  };
}



