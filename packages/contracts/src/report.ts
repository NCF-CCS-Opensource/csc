import type { EventType } from "./event";

export type Half = "am" | "pm";
export type SessionStatus = "present" | "incomplete" | "absent";

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
  event: {
    id: string;
    name: string;
    date: string;
    venue: string | null;
    type: EventType;
    halfDayPenaltyAmount: string;
    semesterName: string;
  };
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

export type StudentEventBreakdown = {
  eventId: string;
  eventName: string;
  date: string;
  amStatus: SessionStatus;
  pmStatus: SessionStatus;
  penaltyAmount: number;
  paymentStatus: "PAID" | "UNPAID" | "PARTIAL" | "NONE";
};

export type PerStudentReportData = {
  student: { id: string; name: string; studentId: string; program: string };
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

export type PerSemesterReportData = {
  semester: { id: string; name: string; startDate: string; endDate: string; closedAt: Date | null };
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

export type FinancialReportData = {
  semester: { id: string; name: string; startDate: string; endDate: string; closedAt: Date | null };
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
