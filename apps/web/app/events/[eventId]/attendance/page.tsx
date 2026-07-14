import { attendanceSessions, events, penalties, students } from "@attendance/db";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requireOfficerOrGovernor } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateSession } from "./actions";

export const dynamic = "force-dynamic";

function toLocalInputValue(date: Date | null): string {
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default async function AttendancePage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const officer = await requireOfficerOrGovernor();
  const { eventId } = await params;

  const event = await db.query.events.findFirst({ where: eq(events.id, eventId) });
  if (!event) notFound();
  if (event.officerId !== officer.id && officer.role !== "governor") notFound();

  const rows = await db
    .select({
      sessionId: attendanceSessions.id,
      half: attendanceSessions.half,
      timeIn: attendanceSessions.timeIn,
      timeOut: attendanceSessions.timeOut,
      studentName: students.name,
      studentIdText: students.studentId,
      penaltyAmount: penalties.amount,
    })
    .from(attendanceSessions)
    .innerJoin(students, eq(attendanceSessions.studentId, students.id))
    .leftJoin(penalties, eq(penalties.attendanceSessionId, attendanceSessions.id))
    .where(eq(attendanceSessions.eventId, event.id))
    .orderBy(students.name, attendanceSessions.half);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-8">
      <h1 className="text-xl font-medium">{event.name} — Attendance</h1>
      <p className="text-sm text-zinc-500">
        Half-day penalty: ₱{event.halfDayPenaltyAmount}
      </p>

      <div className="flex flex-col gap-1">
        {rows.length === 0 && (
          <p className="text-sm text-zinc-500">No scans recorded yet.</p>
        )}
        {rows.map((row) => (
          <div
            key={row.sessionId}
            className="grid grid-cols-6 items-center gap-2 border-t py-2 text-sm"
          >
            <div className="col-span-2">
              {row.studentName} ({row.studentIdText})
            </div>
            <div>{row.half.toUpperCase()}</div>
            <form action={updateSession} className="col-span-3 grid grid-cols-4 items-center gap-2">
              <input type="hidden" name="sessionId" value={row.sessionId} />
              <input
                type="datetime-local"
                name="timeIn"
                defaultValue={toLocalInputValue(row.timeIn)}
                className="rounded border px-1 text-xs"
              />
              <input
                type="datetime-local"
                name="timeOut"
                defaultValue={toLocalInputValue(row.timeOut)}
                className="rounded border px-1 text-xs"
              />
              <span className={row.penaltyAmount ? "text-red-600" : "text-zinc-500"}>
                {row.penaltyAmount ? `Absent — ₱${row.penaltyAmount}` : "Present"}
              </span>
              <button type="submit" className="text-xs underline">
                Save
              </button>
            </form>
          </div>
        ))}
      </div>
    </main>
  );
}
