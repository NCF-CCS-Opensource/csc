import { DomainLifecycleError } from "../../../shared/domain/lifecycle-error";

export type DateRange = { startDate: string; endDate: string };
export type ValidationError = { field: string; message: string };

export class SemesterLifecycleError extends DomainLifecycleError {}

// Ported 1:1 from apps/web/lib/semesters.ts.
export function validateSemesterDates(
  startDate: string,
  endDate: string,
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (startDate === "") {
    errors.push({ field: "startDate", message: "Start date is required" });
  }

  if (endDate === "") {
    errors.push({ field: "endDate", message: "End date is required" });
  }

  if (startDate && endDate && endDate <= startDate) {
    errors.push({
      field: "endDate",
      message: "End date must be after the start date",
    });
  }

  return errors;
}
