import { Inject, Injectable } from "@nestjs/common";
import { STUDENT_REPOSITORY, type StudentRepository } from "../domain/student-repository";
import type { Actor } from "../../../shared/domain/actor";

// Single execute entrypoint (ADR-0017). The one use case this tracer
// bullet proves end to end: resolve the caller's own Student identity.
@Injectable()
export class GetCallerIdentityUseCase {
  constructor(
    @Inject(STUDENT_REPOSITORY) private readonly students: StudentRepository,
  ) {}

  async execute(authUserId: string): Promise<Actor | null> {
    return this.students.findByAuthUserId(authUserId);
  }
}
