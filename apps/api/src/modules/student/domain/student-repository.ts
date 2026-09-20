import type { StudentSummary } from "@attendance/contracts";
import type { Actor } from "../../../shared/domain/actor";
import type { Role } from "../../../shared/domain/role";

export interface NewStudent {
  authUserId: string;
  email: string;
  name: string;
  program: string;
  section: string | null;
  studentId: string;
  role: Role;
}

export interface StudentCorrection {
  studentId: string;
  program: string;
}

// A repository interface, satisfied by infrastructure/. The domain layer
// never imports the adapter that implements this.
export interface StudentRepository {
  findByAuthUserId(authUserId: string): Promise<Actor | null>;
  // Tolerant of a concurrent duplicate claim, same as the ported web
  // module: onConflictDoNothing, falling back to a re-fetch (ADR-0019).
  create(input: NewStudent): Promise<Actor>;
  // Throws DuplicateStudentIdError / StudentNotFoundError (student-errors.ts).
  updateIdAndProgram(id: string, input: StudentCorrection): Promise<Actor>;
  // The whole roster, name-ascending. No pagination (spec #117).
  listAll(): Promise<StudentSummary[]>;
  // No-op (returns null) unless the row exists and is still role "student"
  // — mirrors the ported apps/web command exactly.
  promoteToOfficer(id: string): Promise<Actor | null>;
}

export const STUDENT_REPOSITORY = Symbol("StudentRepository");
