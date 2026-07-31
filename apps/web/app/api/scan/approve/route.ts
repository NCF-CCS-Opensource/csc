import { attendanceSessions, events, scans, students } from "@attendance/db";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { syncPenaltyForSession } from "@/lib/penalties";
import { BOOTH_MODES, decodeQrPayload, modeToHalfAndField, type BoothMode } from "@/lib/scan";

export async function POST(request: Request) {
  const authorization = await authorizeRequest(request, "manage_operations");
  if (!authorization.ok) return authorization.response;
  const officer = authorization.actor;

  const body = (await request.json()) as {
    scanId?: string;
    eventId?: string;
    mode?: string;
    qrPayload?: string;
    scannedAt?: string;
  };
  const { scanId, eventId, mode, qrPayload, scannedAt } = body;

  if (
    !scanId ||
    !eventId ||
    !qrPayload ||
    !scannedAt ||
    !BOOTH_MODES.includes(mode as BoothMode)
  ) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const decoded = decodeQrPayload(qrPayload);
  if (!decoded) return NextResponse.json({ error: "Unreadable QR" }, { status: 422 });

  const student = await db.query.students.findFirst({
    where: eq(students.studentId, decoded.studentId),
  });
  if (!student) return NextResponse.json({ error: "Unknown student" }, { status: 404 });

  // Idempotent on scanId: a retried offline-sync of the same scan is a no-op
  // past this point, so it can never double-apply or duplicate-log.
  const [inserted] = await db
    .insert(scans)
    .values({
      id: scanId,
      eventId: event.id,
      studentId: student.id,
      qrPayload,
      result: "approved",
      mode: mode as BoothMode,
      officerId: officer.id,
      scannedAt: new Date(scannedAt),
    })
    .onConflictDoNothing({ target: scans.id })
    .returning();

  if (inserted) {
    const { half, field } = modeToHalfAndField(mode as BoothMode);
    // Capture-time truth: the Officer's device timestamp, not server receipt time.
    const capturedAt = new Date(scannedAt);

    const existingSession = await db.query.attendanceSessions.findFirst({
      where: and(
        eq(attendanceSessions.eventId, event.id),
        eq(attendanceSessions.studentId, student.id),
        eq(attendanceSessions.half, half),
      ),
    });

    let sessionId: string;
    if (existingSession) {
      sessionId = existingSession.id;
      await db
        .update(attendanceSessions)
        .set(field === "timeIn" ? { timeIn: capturedAt } : { timeOut: capturedAt })
        .where(eq(attendanceSessions.id, existingSession.id));
    } else {
      const [createdSession] = await db
        .insert(attendanceSessions)
        .values(
          field === "timeIn"
            ? { eventId: event.id, studentId: student.id, half, timeIn: capturedAt }
            : { eventId: event.id, studentId: student.id, half, timeOut: capturedAt },
        )
        .returning();
      sessionId = createdSession.id;
    }

    await syncPenaltyForSession(sessionId);
  }

  return NextResponse.json({
    ok: true,
    student: { name: student.name, studentId: student.studentId, program: student.program },
  });
}
