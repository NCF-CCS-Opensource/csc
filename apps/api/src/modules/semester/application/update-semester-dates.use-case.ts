import { Inject, Injectable } from "@nestjs/common";
import { SEMESTER_REPOSITORY, type SemesterRepository } from "../domain/semester-repository";
import {
  SemesterLifecycleError,
  validateSemesterInput,
  type SemesterInput,
} from "../domain/semester-lifecycle";
import type { Semester } from "../domain/semester";

@Injectable()
export class UpdateSemesterDatesUseCase {
  constructor(
    @Inject(SEMESTER_REPOSITORY) private readonly semesters: SemesterRepository,
  ) {}

  async execute(id: string, input: SemesterInput): Promise<Semester> {
    const errors = validateSemesterInput(input);
    if (errors[0]) throw new SemesterLifecycleError(errors[0].message, 400);
    return this.semesters.updateDates(id, input);
  }
}
