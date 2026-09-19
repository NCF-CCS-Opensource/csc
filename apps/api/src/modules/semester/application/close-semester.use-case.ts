import { Inject, Injectable } from "@nestjs/common";
import { SEMESTER_REPOSITORY, type SemesterRepository } from "../domain/semester-repository";
import type { Semester } from "../domain/semester";

// Closing still permits Attendance correction and Payment recording
// (CONTEXT.md's Semester entry) — those modules aren't gated by closedAt at
// all, so there's nothing for this use case to check beyond existence.
@Injectable()
export class CloseSemesterUseCase {
  constructor(
    @Inject(SEMESTER_REPOSITORY) private readonly semesters: SemesterRepository,
  ) {}

  async execute(id: string): Promise<Semester> {
    return this.semesters.close(id);
  }
}
