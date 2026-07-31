import { events, semesters } from "@attendance/db";
import { and, eq, gt, lt, or } from "drizzle-orm";
import { db } from "./db";
import type { ValidationError } from "./registration";
import { hasCapability, type Role } from "./roles";

export class SemesterLifecycleError extends Error {}

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

export async function createSemester(
  actor: { role: Role },
  dates: { startDate: string; endDate: string },
): Promise<void> {
  if (!hasCapability(actor.role, "administer")) {
    throw new SemesterLifecycleError("Forbidden");
  }

  const errors = validateSemesterDates(dates.startDate, dates.endDate);
  if (errors[0]) throw new SemesterLifecycleError(errors[0].message);

  try {
    await db.insert(semesters).values(dates);
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      throw new SemesterLifecycleError(
        "Close the current Semester before opening a new one",
      );
    }
    throw error;
  }
}

export async function updateSemesterDates(
  actor: { role: Role },
  id: string,
  dates: { startDate: string; endDate: string },
): Promise<void> {
  if (!hasCapability(actor.role, "administer")) {
    throw new SemesterLifecycleError("Forbidden");
  }

  const errors = validateSemesterDates(dates.startDate, dates.endDate);
  if (errors[0]) throw new SemesterLifecycleError(errors[0].message);

  await db.transaction(async (transaction) => {
    const [semester] = await transaction
      .select()
      .from(semesters)
      .where(eq(semesters.id, id))
      .limit(1)
      .for("update");
    if (!semester) throw new SemesterLifecycleError("Semester not found");

    const excludedEvent = await transaction.query.events.findFirst({
      where: and(
        eq(events.semesterId, id),
        or(lt(events.date, dates.startDate), gt(events.date, dates.endDate)),
      ),
    });
    if (excludedEvent) {
      throw new SemesterLifecycleError(
        "Semester dates must include every existing Event",
      );
    }

    await transaction.update(semesters).set(dates).where(eq(semesters.id, id));
  });
}
