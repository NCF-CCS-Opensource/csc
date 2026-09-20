import { Inject, Injectable } from "@nestjs/common";
import type { StudentSummary } from "@attendance/contracts";
import { STUDENT_REPOSITORY, type StudentRepository } from "../domain/student-repository";

// Closes Known Gap #1 (PR #184): the whole Students roster, ported from
// apps/web's studentsSnapshot — no pagination, no search param, filtered
// client-side by every caller (spec #117).
@Injectable()
export class ListStudentsUseCase {
  constructor(
    @Inject(STUDENT_REPOSITORY) private readonly students: StudentRepository,
  ) {}

  execute(): Promise<StudentSummary[]> {
    return this.students.listAll();
  }
}
