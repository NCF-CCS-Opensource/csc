export interface RosterRow {
  email: string | null;
  studentId: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  program: string;
  section: string;
}

// A repository interface, satisfied by infrastructure/ (ADR-0017).
export interface EnrollmentRosterRepository {
  findByEmail(email: string): Promise<RosterRow | null>;
  findByStudentId(studentId: string): Promise<RosterRow | null>;
}

export const ENROLLMENT_ROSTER_REPOSITORY = Symbol("EnrollmentRosterRepository");
