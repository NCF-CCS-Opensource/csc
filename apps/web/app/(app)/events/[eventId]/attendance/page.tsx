import { attendanceSessions, events, payments, penalties, students } from "@attendance/db";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOfficerOrGovernor } from "@/lib/auth";
import { db } from "@/lib/db";
import { computeEventGrid, materializeEventNoShows } from "@/lib/ledger";
import { AttendanceGrid } from "./attendance-grid";

export const dynamic = "force-dynamic";

export default async function AttendancePage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  await requireOfficerOrGovernor();
  const { eventId } = await params;

  const event = await db.query.events.findFirst({ where: eq(events.id, eventId) });
  if (!event) notFound();

  // Give every no-show a real absent session + Penalty row so it appears here
  // as a payable row. Scoped to this Event, idempotent — safe to repeat.
  await materializeEventNoShows(event.id);

  const sessionRows = await db
    .select({
      id: attendanceSessions.id,
      studentId: attendanceSessions.studentId,
      half: attendanceSessions.half,
      timeIn: attendanceSessions.timeIn,
      timeOut: attendanceSessions.timeOut,
      name: students.name,
      studentIdText: students.studentId,
    })
    .from(attendanceSessions)
    .innerJoin(students, eq(attendanceSessions.studentId, students.id))
    .where(eq(attendanceSessions.eventId, event.id))
    .orderBy(students.name);

  const penaltyRows = await db
    .select({
      id: penalties.id,
      attendanceSessionId: penalties.attendanceSessionId,
      amount: penalties.amount,
    })
    .from(penalties)
    .innerJoin(attendanceSessions, eq(penalties.attendanceSessionId, attendanceSessions.id))
    .where(eq(attendanceSessions.eventId, event.id));

  const paymentRows = await db
    .select({ penaltyId: payments.penaltyId })
    .from(payments)
    .innerJoin(penalties, eq(payments.penaltyId, penalties.id))
    .innerJoin(attendanceSessions, eq(penalties.attendanceSessionId, attendanceSessions.id))
    .where(eq(attendanceSessions.eventId, event.id));

  // Distinct liable Students, in name order (materialize ran first, so every
  // liable Student already has session rows).
  const studentList = [...new Map(sessionRows.map((r) => [r.studentId, r])).values()].map(
    (r) => ({ id: r.studentId, name: r.name, studentId: r.studentIdText }),
  );

  const rows = computeEventGrid({
    eventType: event.type,
    students: studentList,
    sessions: sessionRows,
    penalties: penaltyRows,
    payments: paymentRows,
  });

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-8">
      <h1 className="text-xl font-medium">{event.name} — Attendance</h1>
      <p className="text-muted-foreground text-sm">
        Half-day penalty: ₱{event.halfDayPenaltyAmount}
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-muted-foreground text-sm">No liable Students for this Event.</p>
          ) : (
            <AttendanceGrid eventId={event.id} rows={rows} />
          )}
        </CardContent>
      </Card>
    </main>
  );
}
