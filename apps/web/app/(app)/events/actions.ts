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
  const officer = await requireOfficerOrGovernor();

  const input = {
    name: String(formData.get("name") ?? "").trim(),
    type: String(formData.get("type") ?? "") as EventType,
    halfDayPenaltyAmount: String(formData.get("halfDayPenaltyAmount") ?? ""),
  };

  const errors = validateEventInput(input);
  if (errors.length > 0) fail(errors[0].message);

  const openSemester = await db.query.semesters.findFirst({
    where: isNull(semesters.closedAt),
  });
  if (!openSemester) fail("No open Semester — ask the Governor to open one");

  await db.insert(events).values({
    name: input.name,
    type: input.type,
    halfDayPenaltyAmount: input.halfDayPenaltyAmount,
    semesterId: openSemester.id,
    officerId: officer.id,
  });

  redirect("/events");
}
