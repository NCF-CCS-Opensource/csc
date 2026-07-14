import { events } from "@attendance/db";
import { NextResponse } from "next/server";
import { requireOfficerFromRequest } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { findOpenSemester, parseEventInput, validateEventInput } from "@/lib/events";

export async function POST(request: Request) {
  const officer = await requireOfficerFromRequest(request);
  if (!officer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const input = parseEventInput(await request.json());

  const openSemester = await findOpenSemester();
  if (!openSemester) {
    return NextResponse.json(
      { error: "No open Semester — ask the Governor to open one" },
      { status: 422 },
    );
  }

  const errors = validateEventInput(input, openSemester);
  if (errors.length > 0) {
    return NextResponse.json({ error: errors[0].message, errors }, { status: 422 });
  }

  const [created] = await db
    .insert(events)
    .values({
      name: input.name,
      type: input.type,
      halfDayPenaltyAmount: input.halfDayPenaltyAmount,
      date: input.date,
      venue: input.venue,
      semesterId: openSemester.id,
      officerId: officer.id,
    })
    .returning();

  return NextResponse.json({ event: { ...created, attendeeCount: 0 } });
}
