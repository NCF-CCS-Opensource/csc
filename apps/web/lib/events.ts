import type { ValidationError } from "./registration";

export const EVENT_TYPES = ["whole_day", "half_day"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export type EventInput = {
  name: string;
  type: EventType;
  halfDayPenaltyAmount: string;
};

export function validateEventInput(input: EventInput): ValidationError[] {
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

  return errors;
}

// Whole-day absence penalty derives as 2x the half-day amount — never stored,
// always computed from halfDayPenaltyAmount.
export function deriveWholeDayPenalty(halfDayPenaltyAmount: string): number {
  return Math.round(Number(halfDayPenaltyAmount) * 2 * 100) / 100;
}
