import { DomainLifecycleError } from "../../../shared/domain/lifecycle-error";

export type DateRange = { startDate: string; endDate: string };
export type SemesterInput = DateRange & { safFeeAmount: string };
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

// Create and edit both require an amount above zero; only the rollout
// migration can leave it null (ADR 0024).
export function validateSemesterInput(input: SemesterInput): ValidationError[] {
  const errors = validateSemesterDates(input.startDate, input.endDate);
  const amount = Number(input.safFeeAmount);
  if (typeof input.safFeeAmount !== "string" || !Number.isFinite(amount) || amount <= 0) {
    errors.push({ field: "safFeeAmount", message: "SAF Fee amount must be greater than 0" });
  }
  return errors;
}
