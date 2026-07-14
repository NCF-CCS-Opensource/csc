import { events, semesters } from "@attendance/db";
import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireOfficerFromRequest } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { validateEventUpdate, type EventType } from "@/lib/events";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const officer = await requireOfficerFromRequest(request);
  if (!officer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await db.query.events.findFirst({
    where: and(eq(events.id, id), eq(events.officerId, officer.id)),
  });
  if (!existing) return NextResponse.json({ error: "Event not found" }, { status: 404 });

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
  const officer = await requireOfficerFromRequest(request);
  if (!officer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await db.query.events.findFirst({
    where: and(eq(events.id, id), eq(events.officerId, officer.id)),
  });
  if (!existing) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  // FK cascades (scans, attendanceSessions, penalties, payments) do the rest.
  await db.delete(events).where(eq(events.id, id));

  return NextResponse.json({ ok: true });
}
