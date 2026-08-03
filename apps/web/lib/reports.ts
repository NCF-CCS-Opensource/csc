import { currentCampusDate, missingHalves, type EventType } from "./ledger";
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
