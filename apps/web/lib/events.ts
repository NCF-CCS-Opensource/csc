import { semesters } from "@attendance/db";
import { isNull } from "drizzle-orm";
import { db } from "./db";
import type { ValidationError } from "./registration";

export const EVENT_TYPES = ["whole_day", "half_day"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export type EventInput = {
  name: string;
  type: EventType;
  halfDayPenaltyAmount: string;
  date: string;
  venue?: string;
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

// Same rules as creation — an Event can be edited freely up until it's
// removed from the open Semester, so there's nothing update-specific to check.
export function validateEventUpdate(
  input: EventInput,
  semesterRange: SemesterRange,
): ValidationError[] {
  return validateEventInput(input, semesterRange);
}

// Shared by POST /api/events and PATCH /api/events/:id — normalizes a raw
// JSON body into an EventInput the same way both routes need it.
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

// Shared by POST /api/events and PATCH /api/events/:id — an Event is always
// scoped to the currently-open Semester (see CONTEXT.md's Semester entry).
// Null means there isn't one; the caller decides how to report that.
export async function findOpenSemester(): Promise<(SemesterRange & { id: string }) | null> {
  return (
    (await db.query.semesters.findFirst({
      where: isNull(semesters.closedAt),
    })) ?? null
  );
}

// Whole-day absence penalty derives as 2x the half-day amount — never stored,
// always computed from halfDayPenaltyAmount.
export function deriveWholeDayPenalty(halfDayPenaltyAmount: string): number {
  return Math.round(Number(halfDayPenaltyAmount) * 2 * 100) / 100;
}
