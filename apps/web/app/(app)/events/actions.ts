"use server";

import { events, semesters } from "@attendance/db";
import { isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { requireOfficerOrGovernor } from "@/lib/auth";
import { db } from "@/lib/db";
import { validateEventInput, type EventType } from "@/lib/events";

function fail(message: string): never {
  redirect(`/events?error=${encodeURIComponent(message)}`);
}

export async function createEvent(formData: FormData) {
  await requireOfficerOrGovernor();

  const input = {
    name: String(formData.get("name") ?? "").trim(),
    type: String(formData.get("type") ?? "") as EventType,
    halfDayPenaltyAmount: String(formData.get("halfDayPenaltyAmount") ?? ""),
    date: String(formData.get("date") ?? ""),
    venue: String(formData.get("venue") ?? "").trim() || undefined,
  };

  const openSemester = await db.query.semesters.findFirst({
    where: isNull(semesters.closedAt),
  });
  if (!openSemester) fail("No open Semester — ask the Governor to open one");

  const errors = validateEventInput(input, openSemester);
  if (errors.length > 0) fail(errors[0].message);

  await db.insert(events).values({
    name: input.name,
    type: input.type,
    halfDayPenaltyAmount: input.halfDayPenaltyAmount,
    date: input.date,
    venue: input.venue,
    semesterId: openSemester.id,
  });

  redirect("/events");
}
