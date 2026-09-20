import { Inject, Injectable } from "@nestjs/common";
import { SEMESTER_REPOSITORY, type SemesterRepository } from "../domain/semester-repository";

// Closes Known Gap #2 (PR #184), ported from admin/actions.ts#deleteSemester.
// Succeeds only when no Event references this Semester yet (FK constraint,
// enforced by the repository, not re-checked here).
@Injectable()
export class DeleteSemesterUseCase {
  constructor(
    @Inject(SEMESTER_REPOSITORY) private readonly semesters: SemesterRepository,
  ) {}

  execute(id: string): Promise<void> {
    return this.semesters.delete(id);
  }
}
