import { Inject, Injectable } from "@nestjs/common";
import { SEMESTER_REPOSITORY, type SemesterRepository } from "../domain/semester-repository";
import {
  SemesterLifecycleError,
  validateSemesterDates,
  type DateRange,
} from "../domain/semester-lifecycle";
import type { Semester } from "../domain/semester";

@Injectable()
export class UpdateSemesterDatesUseCase {
  constructor(
    @Inject(SEMESTER_REPOSITORY) private readonly semesters: SemesterRepository,
  ) {}

  async execute(id: string, dates: DateRange): Promise<Semester> {
    const errors = validateSemesterDates(dates.startDate, dates.endDate);
    if (errors[0]) throw new SemesterLifecycleError(errors[0].message, 400);
    return this.semesters.updateDates(id, dates);
  }
}
