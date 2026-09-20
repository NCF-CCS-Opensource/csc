import type { Semester } from "./semester";
import type { DateRange } from "./semester-lifecycle";

// A repository interface, satisfied by infrastructure/. Compound methods
// (updateDates, close) own their own transaction and throw
// SemesterLifecycleError for a lifecycle violation — the infra layer enforces
// the same locking/consistency guarantees apps/web/lib/semesters.ts did.
export interface SemesterRepository {
  findOpen(): Promise<Semester | null>;
  findById(id: string): Promise<Semester | null>;
  findAll(): Promise<Semester[]>;
  create(dates: DateRange): Promise<Semester>;
  updateDates(id: string, dates: DateRange): Promise<Semester>;
  close(id: string): Promise<Semester>;
  // Throws SemesterLifecycleError(409) when an Event still references it,
  // 404 when the id doesn't exist.
  delete(id: string): Promise<void>;
}

export const SEMESTER_REPOSITORY = Symbol("SemesterRepository");
