import { Inject, Injectable } from "@nestjs/common";
import { STUDENT_REPOSITORY, type StudentRepository } from "../domain/student-repository";
import type { Actor } from "../../../shared/domain/actor";

// Closes Known Gap #3 (PR #184): promotes a Student to Officer, ported from
// apps/web/admin/actions.ts#promoteToOfficer. A missing row or one that's
// already Officer/Governor is a silent no-op (null), same as the ported
// command's WHERE-clause — no demote action exists, so this never downgrades.
@Injectable()
export class PromoteStudentUseCase {
  constructor(
    @Inject(STUDENT_REPOSITORY) private readonly students: StudentRepository,
  ) {}

  execute(id: string): Promise<Actor | null> {
    return this.students.promoteToOfficer(id);
  }
}
