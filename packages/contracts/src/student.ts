import type { Role } from "./identity";

// Student correction (ADR-0019): an Officer or Governor corrects a
// Student's Student ID and Program. Name, email and role never pass
// through here — the same restriction as the web module's original
// StudentCorrectionInput.
export interface CorrectStudentRequest {
  studentId: string;
  program: string;
}

// One row of the Students roster (ADR-0019). No pagination — under 600 rows,
// filtered client-side (spec #117), same as the ported apps/web read.
export interface StudentSummary {
  id: string;
  name: string;
  email: string;
  studentId: string;
  program: string;
  role: Role;
}

export interface StudentListResponse {
  students: StudentSummary[];
}

