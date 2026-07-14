import { attendanceSessions, events, payments, penalties, semesters } from "@attendance/db";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
        <p className="text-muted-foreground text-sm">No open Semester.</p>
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

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground text-sm font-normal">
              Present / Absent
            </CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-medium">
            {totalPresent} / {totalAbsent}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground text-sm font-normal">
              Attendance rate
            </CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-medium">{totalRate.toFixed(1)}%</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground text-sm font-normal">
              Collected
            </CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-medium">
            ₱{totalCollected.toFixed(2)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Events</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.length === 0 ? (
            <p className="text-muted-foreground text-sm">No Events this Semester.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Present / Absent</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead className="text-right">Collected</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.map(({ event, present, absent, rate, collected }) => (
                  <TableRow key={event.id}>
                    <TableCell>{event.name}</TableCell>
                    <TableCell>
                      {present} / {absent}
                    </TableCell>
                    <TableCell>{rate.toFixed(1)}%</TableCell>
                    <TableCell className="text-right">₱{collected.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
