import { attendanceSessions, events, payments, penalties, semesters } from "@attendance/db";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { requireOfficerOrGovernor } from "@/lib/auth";
import { db } from "@/lib/db";
import { isSessionAbsent } from "@/lib/scan";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const officer = await requireOfficerOrGovernor();

  const openSemester = await db.query.semesters.findFirst({
    where: isNull(semesters.closedAt),
  });

  if (!openSemester) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-8">
        <h1 className="text-xl font-medium">Analytics</h1>
        <p className="text-sm text-zinc-500">No open Semester.</p>
      </main>
    );
  }

  // Governor sees every Officer's Events rolled up; an Officer sees only
  // their own — same page, same query shape, different scope.
  const eventScope =
    officer.role === "governor"
      ? eq(events.semesterId, openSemester.id)
      : and(eq(events.semesterId, openSemester.id), eq(events.officerId, officer.id));

  const eventRows = await db.select().from(events).where(eventScope);
  const eventIds = eventRows.map((event) => event.id);

  const sessions =
    eventIds.length > 0
      ? await db
          .select()
          .from(attendanceSessions)
          .where(inArray(attendanceSessions.eventId, eventIds))
      : [];

  const paymentRows =
    eventIds.length > 0
      ? await db
          .select({ eventId: attendanceSessions.eventId, amount: payments.amount })
          .from(payments)
          .innerJoin(penalties, eq(payments.penaltyId, penalties.id))
          .innerJoin(attendanceSessions, eq(penalties.attendanceSessionId, attendanceSessions.id))
          .where(inArray(attendanceSessions.eventId, eventIds))
      : [];

  const stats = eventRows.map((event) => {
    const eventSessions = sessions.filter((s) => s.eventId === event.id);
    const present = eventSessions.filter((s) => !isSessionAbsent(s)).length;
    const absent = eventSessions.filter((s) => isSessionAbsent(s)).length;
    const total = present + absent;
    const rate = total > 0 ? (present / total) * 100 : 0;
    const collected = paymentRows
      .filter((p) => p.eventId === event.id)
      .reduce((sum, p) => sum + Number(p.amount), 0);
    return { event, present, absent, rate, collected };
  });

  const totalPresent = stats.reduce((sum, s) => sum + s.present, 0);
  const totalAbsent = stats.reduce((sum, s) => sum + s.absent, 0);
  const totalCollected = stats.reduce((sum, s) => sum + s.collected, 0);
  const totalSessions = totalPresent + totalAbsent;
  const totalRate = totalSessions > 0 ? (totalPresent / totalSessions) * 100 : 0;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-8">
      <h1 className="text-xl font-medium">
        {officer.role === "governor" ? "Analytics — all Officers" : "Analytics — my Events"}
      </h1>

      <div className="grid grid-cols-3 gap-4 rounded border p-4 text-sm">
        <div>
          <div className="text-zinc-500">Present / Absent</div>
          <div className="text-lg font-medium">
            {totalPresent} / {totalAbsent}
          </div>
        </div>
        <div>
          <div className="text-zinc-500">Attendance rate</div>
          <div className="text-lg font-medium">{totalRate.toFixed(1)}%</div>
        </div>
        <div>
          <div className="text-zinc-500">Collected</div>
          <div className="text-lg font-medium">₱{totalCollected.toFixed(2)}</div>
        </div>
      </div>

      <div className="flex flex-col gap-1 text-sm">
        {stats.length === 0 && (
          <p className="text-sm text-zinc-500">No Events this Semester.</p>
        )}
        {stats.map(({ event, present, absent, rate, collected }) => (
          <div key={event.id} className="grid grid-cols-4 gap-2 border-t py-2">
            <span>{event.name}</span>
            <span>
              {present} / {absent}
            </span>
            <span>{rate.toFixed(1)}%</span>
            <span>₱{collected.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
