import { attendanceSessions, events, students } from "@attendance/db";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireOfficerFromRequest } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { BOOTH_MODES, decodeQrPayload, modeToHalfAndField, type BoothMode } from "@/lib/scan";

export async function POST(request: Request) {
  const officer = await requireOfficerFromRequest(request);
  if (!officer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    eventId?: string;
    mode?: string;
    qrPayload?: string;
    scannedAt?: string;
  };
  const { eventId, mode, qrPayload, scannedAt } = body;

  if (
    !eventId ||
    !qrPayload ||
    !scannedAt ||
    !BOOTH_MODES.includes(mode as BoothMode)
  ) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const event = await db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.officerId, officer.id)),
  });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const decoded = decodeQrPayload(qrPayload);
  if (!decoded) return NextResponse.json({ error: "Unreadable QR" }, { status: 422 });

  const student = await db.query.students.findFirst({
    where: eq(students.studentId, decoded.studentId),
  });
  if (!student) return NextResponse.json({ error: "Unknown student" }, { status: 404 });

  const { half, field } = modeToHalfAndField(mode as BoothMode);
  // Capture-time truth: the Officer's device timestamp, not server receipt time.
  const capturedAt = new Date(scannedAt);

  const existing = await db.query.attendanceSessions.findFirst({
    where: and(
      eq(attendanceSessions.eventId, event.id),
      eq(attendanceSessions.studentId, student.id),
      eq(attendanceSessions.half, half),
    ),
  });

  if (existing) {
    await db
      .update(attendanceSessions)
      .set(field === "timeIn" ? { timeIn: capturedAt } : { timeOut: capturedAt })
      .where(eq(attendanceSessions.id, existing.id));
  } else {
    await db.insert(attendanceSessions).values(
      field === "timeIn"
        ? { eventId: event.id, studentId: student.id, half, timeIn: capturedAt }
        : { eventId: event.id, studentId: student.id, half, timeOut: capturedAt },
    );
  }

  return NextResponse.json({
    ok: true,
    student: { name: student.name, studentId: student.studentId, program: student.program },
  });
}
