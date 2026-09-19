import { DomainLifecycleError } from "../../../shared/domain/lifecycle-error";

// Ported 1:1 from apps/web/lib/events.ts (CONTEXT.md's Event entry, ADR-0004).
export const EVENT_TYPES = ["whole_day", "half_day"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export type EventInput = {
  name: string;
  type: EventType;
  halfDayPenaltyAmount: string;
  date: string;
  venue?: string;
};

export type SemesterRange = { startDate: string; endDate: string };
export type ValidationError = { field: string; message: string };

export class EventLifecycleError extends DomainLifecycleError {}

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

// Field validation is shared with creation; lifecycle state (attendance
// activity, Semester closure) is enforced by the infra repository's update()
// in the same transaction as the write.
export function validateEventUpdate(
  input: EventInput,
  semesterRange: SemesterRange,
): ValidationError[] {
  return validateEventInput(input, semesterRange);
}

// Shared by the create/update controller actions — normalizes a raw JSON
// body into an EventInput the same way both need it.
export function parseEventInput(body: {
  name?: string;
  type?: string;
  halfDayPenaltyAmount?: string;
  date?: string;
  venue?: string;
}): EventInput {
  return {
    name: (body.name ?? "").trim(),
    type: (body.type ?? "") as EventType,
    halfDayPenaltyAmount: String(body.halfDayPenaltyAmount ?? ""),
    date: String(body.date ?? ""),
    venue: body.venue?.trim() || undefined,
  };
}

// Whole-day absence penalty derives as 2x the half-day amount — never
// stored, always computed from halfDayPenaltyAmount.
export function deriveWholeDayPenalty(halfDayPenaltyAmount: string): number {
  return Math.round(Number(halfDayPenaltyAmount) * 2 * 100) / 100;
}
