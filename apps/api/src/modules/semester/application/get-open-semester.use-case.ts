import { Inject, Injectable } from "@nestjs/common";
import { SEMESTER_REPOSITORY, type SemesterRepository } from "../domain/semester-repository";
import type { Semester } from "../domain/semester";

// Used by the Event module's create validation and by the web BFF to show
// the Events page its creatable date window.
@Injectable()
export class GetOpenSemesterUseCase {
  constructor(
    @Inject(SEMESTER_REPOSITORY) private readonly semesters: SemesterRepository,
  ) {}

  async execute(): Promise<Semester | null> {
    return this.semesters.findOpen();
  }
}
