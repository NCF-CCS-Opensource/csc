import { Inject, Injectable } from "@nestjs/common";
import { SEMESTER_REPOSITORY, type SemesterRepository } from "../domain/semester-repository";
import type { Semester } from "../domain/semester";

// Closes Known Gap #4 (PR #184): every Semester, newest first — unlike
// semester/current, not scoped to the open one. Backs Admin's and
// Analytics' "all Semesters" reads.
@Injectable()
export class ListSemestersUseCase {
  constructor(
    @Inject(SEMESTER_REPOSITORY) private readonly semesters: SemesterRepository,
  ) {}

  execute(): Promise<Semester[]> {
    return this.semesters.findAll();
  }
}
