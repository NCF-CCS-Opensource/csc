import { attendanceSessions, events } from "@attendance/db";
import { count, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/api-auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const authorization = await authorizeRequest(request, "manage_operations");
  if (!authorization.ok) return authorization.response;

  const allEvents = await db
    .select({
      id: events.id,
      name: events.name,
      semesterId: events.semesterId,
      date: events.date,
      venue: events.venue,
      type: events.type,
      halfDayPenaltyAmount: events.halfDayPenaltyAmount,
      createdAt: events.createdAt,
      // Raw attendanceSessions row count, not distinct students — a
      // whole-day Event's student attending both halves counts twice.
      // Deliberate per spec: a real count, no capacity denominator, not a
      // distinct-attendee metric.
      attendeeCount: count(attendanceSessions.id),
    })
    .from(events)
    .leftJoin(attendanceSessions, eq(attendanceSessions.eventId, events.id))
    .groupBy(events.id)
    .orderBy(desc(events.createdAt));

  return NextResponse.json({
    events: allEvents.map((event) => ({ ...event, attendeeCount: Number(event.attendeeCount) })),
  });
}
