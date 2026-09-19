// Shared shape for the Roster Claim request (ADR-0019). An exact school
// email claims on its own; anyone else must additionally supply the
// Student ID printed on the Enrollment Roster.
export interface ClaimRosterRequest {
  studentId?: string;
}
