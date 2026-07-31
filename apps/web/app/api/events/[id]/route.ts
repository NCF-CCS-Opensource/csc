import { events } from "@attendance/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { findOpenSemester, parseEventInput, validateEventUpdate } from "@/lib/events";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await authorizeRequest(request, "manage_operations");
  if (!authorization.ok) return authorization.response;

  const { id } = await params;
  const existing = await db.query.events.findFirst({
    where: eq(events.id, id),
  });
  if (!existing) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const input = parseEventInput(await request.json());

  const openSemester = await findOpenSemester();
  if (!openSemester) {
    return NextResponse.json(
      { error: "No open Semester — ask the Governor to open one" },
      { status: 422 },
    );
  }

  const errors = validateEventUpdate(input, openSemester);
  if (errors.length > 0) {
    return NextResponse.json({ error: errors[0].message, errors }, { status: 422 });
  }

  const [updated] = await db
    .update(events)
    .set({
      name: input.name,
      type: input.type,
      halfDayPenaltyAmount: input.halfDayPenaltyAmount,
      date: input.date,
      venue: input.venue,
    })
    .where(eq(events.id, id))
    .returning();

  return NextResponse.json({ event: updated });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await authorizeRequest(request, "manage_operations");
  if (!authorization.ok) return authorization.response;

  const { id } = await params;
  const existing = await db.query.events.findFirst({
    where: eq(events.id, id),
  });
  if (!existing) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  // FK cascades (scans, attendanceSessions, penalties, payments) do the rest.
  await db.delete(events).where(eq(events.id, id));

  return NextResponse.json({ ok: true });
}
