import { events, scans, students } from "@attendance/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { decodeQrPayload } from "@/lib/scan";

export async function POST(request: Request) {
  const authorization = await authorizeRequest(request, "manage_operations");
  if (!authorization.ok) {
    return NextResponse.json(
      { error: authorization.error },
      { status: authorization.status },
    );
  }
  const officer = authorization.actor;

  const body = (await request.json()) as {
    scanId?: string;
    eventId?: string;
    qrPayload?: string;
    scannedAt?: string;
  };
  const { scanId, eventId, qrPayload, scannedAt } = body;

  if (!scanId || !eventId || !qrPayload || !scannedAt) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const decoded = decodeQrPayload(qrPayload);
  const student = decoded
    ? await db.query.students.findFirst({ where: eq(students.studentId, decoded.studentId) })
    : null;

  // Idempotent on scanId — a retried offline-sync of the same rejection
  // never inserts a second log row.
  await db
    .insert(scans)
    .values({
      id: scanId,
      eventId: event.id,
      studentId: student?.id ?? null,
      qrPayload,
      result: "rejected",
      officerId: officer.id,
      scannedAt: new Date(scannedAt),
    })
    .onConflictDoNothing({ target: scans.id });

  return NextResponse.json({ ok: true });
}
