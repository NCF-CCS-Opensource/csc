import { Inject, Injectable } from "@nestjs/common";
import type { CorrectStudentRequest } from "@attendance/contracts";
import { STUDENT_REPOSITORY, type StudentRepository } from "../domain/student-repository";
import { InvalidProgramError, InvalidStudentIdError } from "../domain/student-errors";
import { PROGRAM_REPOSITORY } from "../../program/domain/program-repository";
import type { ProgramRepository } from "../../program/domain/program-repository";
import type { Actor } from "../../../shared/domain/actor";

// Ported from apps/web/lib/students.ts (ADR-0014). Any Officer or Governor
// may correct any Student's Student ID and Program directly — no approval
// workflow, no audit trail. The capability check itself lives in
// CapabilityGuard at the HTTP boundary, not here (ADR-0019).
@Injectable()
export class CorrectStudentUseCase {
  constructor(
    @Inject(STUDENT_REPOSITORY) private readonly students: StudentRepository,
    @Inject(PROGRAM_REPOSITORY) private readonly programs: ProgramRepository,
  ) {}

  async execute(id: string, input: CorrectStudentRequest): Promise<Actor> {
    if (input.studentId.trim() === "") throw new InvalidStudentIdError();

    const validPrograms = await this.programs.listNames();
    if (!validPrograms.includes(input.program)) throw new InvalidProgramError();

    return this.students.updateIdAndProgram(id, {
      studentId: input.studentId.trim(),
      program: input.program,
    });
  }
}
