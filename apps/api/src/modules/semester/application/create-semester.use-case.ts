import { Inject, Injectable } from "@nestjs/common";
import { SEMESTER_REPOSITORY, type SemesterRepository } from "../domain/semester-repository";
import {
  SemesterLifecycleError,
  validateSemesterInput,
  type SemesterInput,
} from "../domain/semester-lifecycle";
import type { Semester } from "../domain/semester";

// Authorization (administer) is decided by CapabilityGuard before this runs
// (ADR-0017/0019) — no role check here, unlike the ported Next.js command.
@Injectable()
export class CreateSemesterUseCase {
  constructor(
    @Inject(SEMESTER_REPOSITORY) private readonly semesters: SemesterRepository,
  ) {}

  async execute(input: SemesterInput): Promise<Semester> {
    const errors = validateSemesterInput(input);
    if (errors[0]) throw new SemesterLifecycleError(errors[0].message, 400);
    return this.semesters.create(input);
  }
}
