import { attendanceSessions, events } from "@attendance/db";
import { count, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireOfficerFromRequest } from "@/lib/api-auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const officer = await requireOfficerFromRequest(request);
  if (!officer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const myEvents = await db
    .select({
      id: events.id,
      name: events.name,
      semesterId: events.semesterId,
      date: events.date,
      venue: events.venue,
      type: events.type,
      halfDayPenaltyAmount: events.halfDayPenaltyAmount,
      officerId: events.officerId,
      createdAt: events.createdAt,
      attendeeCount: count(attendanceSessions.id),
    })
    .from(events)
    .leftJoin(attendanceSessions, eq(attendanceSessions.eventId, events.id))
    .where(eq(events.officerId, officer.id))
    .groupBy(events.id)
    .orderBy(desc(events.createdAt));

  return NextResponse.json({
    events: myEvents.map((event) => ({ ...event, attendeeCount: Number(event.attendeeCount) })),
  });
}
