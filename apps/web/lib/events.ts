import type { ValidationError } from "./registration";

export const EVENT_TYPES = ["whole_day", "half_day"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export type EventInput = {
  name: string;
  type: EventType;
  halfDayPenaltyAmount: string;
  date: string;
};

export type SemesterRange = {
  startDate: string;
  endDate: string;
};

export function validateEventInput(
  input: EventInput,
  semesterRange: SemesterRange,
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (input.name.trim() === "") {
    errors.push({ field: "name", message: "Name is required" });
  }

  if (!EVENT_TYPES.includes(input.type)) {
    errors.push({ field: "type", message: "Select whole-day or half-day" });
  }

  const amount = Number(input.halfDayPenaltyAmount);
  if (!Number.isFinite(amount) || amount <= 0) {
    errors.push({
      field: "halfDayPenaltyAmount",
      message: "Penalty amount must be greater than 0",
    });
  }

  const date = new Date(input.date);
  if (Number.isNaN(date.getTime())) {
    errors.push({ field: "date", message: "Date is required" });
  } else if (
    input.date < semesterRange.startDate ||
    input.date > semesterRange.endDate
  ) {
    errors.push({ field: "date", message: "Date must fall within the open Semester" });
  }

  return errors;
}

// Whole-day absence penalty derives as 2x the half-day amount — never stored,
// always computed from halfDayPenaltyAmount.
export function deriveWholeDayPenalty(halfDayPenaltyAmount: string): number {
  return Math.round(Number(halfDayPenaltyAmount) * 2 * 100) / 100;
}
