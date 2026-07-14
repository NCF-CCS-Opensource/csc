import { events, scanRejections, students } from "@attendance/db";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireOfficerFromRequest } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { decodeQrPayload } from "@/lib/scan";

export async function POST(request: Request) {
  const officer = await requireOfficerFromRequest(request);
  if (!officer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    eventId?: string;
    qrPayload?: string;
    scannedAt?: string;
  };
  const { eventId, qrPayload, scannedAt } = body;

  if (!eventId || !qrPayload || !scannedAt) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const event = await db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.officerId, officer.id)),
  });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const decoded = decodeQrPayload(qrPayload);
  const student = decoded
    ? await db.query.students.findFirst({ where: eq(students.studentId, decoded.studentId) })
    : null;

  await db.insert(scanRejections).values({
    eventId: event.id,
    studentId: student?.id ?? null,
    qrPayload,
    officerId: officer.id,
    scannedAt: new Date(scannedAt),
  });

  return NextResponse.json({ ok: true });
}
