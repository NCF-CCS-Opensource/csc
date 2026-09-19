import type { Actor } from "../../../shared/domain/actor";

// A repository interface, satisfied by infrastructure/. The domain layer
// never imports the adapter that implements this.
export interface StudentRepository {
  findByAuthUserId(authUserId: string): Promise<Actor | null>;
}

export const STUDENT_REPOSITORY = Symbol("StudentRepository");
