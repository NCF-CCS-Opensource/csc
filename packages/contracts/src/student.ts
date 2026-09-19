// Student correction (ADR-0019): an Officer or Governor corrects a
// Student's Student ID and Program. Name, email and role never pass
// through here — the same restriction as the web module's original
// StudentCorrectionInput.
export interface CorrectStudentRequest {
  studentId: string;
  program: string;
}
