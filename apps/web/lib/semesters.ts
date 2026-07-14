import type { ValidationError } from "./registration";

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
