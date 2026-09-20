import type {
  PerEventReportInput,
  PerSemesterReportInput,
  PerStudentReportInput,
  FinancialReportInput,
} from "./report";

// A repository interface, satisfied by infrastructure/. Hides Drizzle and
// table shapes from the use case, matching the seam used by
// event/student/program/semester/ledger (domain interface + DI token,
// infrastructure Drizzle implementation).
export interface ReportRepository {
  perEventInput(eventId: string): Promise<PerEventReportInput | null>;
  perStudentInput(studentId: string, semesterId: string): Promise<PerStudentReportInput | null>;
  perSemesterInput(semesterId: string): Promise<PerSemesterReportInput | null>;
  financialInput(semesterId: string): Promise<FinancialReportInput | null>;
}

export const REPORT_REPOSITORY = Symbol("ReportRepository");
