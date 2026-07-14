import { events, semesters } from "@attendance/db";
import { isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireOfficerFromRequest } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { validateEventInput, type EventType } from "@/lib/events";

export async function POST(request: Request) {
  const officer = await requireOfficerFromRequest(request);
  if (!officer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    name?: string;
    type?: string;
    halfDayPenaltyAmount?: string;
    date?: string;
    venue?: string;
  };

  const input = {
    name: (body.name ?? "").trim(),
    type: (body.type ?? "") as EventType,
    halfDayPenaltyAmount: String(body.halfDayPenaltyAmount ?? ""),
    date: String(body.date ?? ""),
    venue: body.venue?.trim() || undefined,
  };

  const openSemester = await db.query.semesters.findFirst({
    where: isNull(semesters.closedAt),
  });
  if (!openSemester) {
    return NextResponse.json({ error: "No open Semester — ask the Governor to open one" }, { status: 422 });
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
