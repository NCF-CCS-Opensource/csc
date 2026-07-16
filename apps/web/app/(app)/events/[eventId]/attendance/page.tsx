import { attendanceSessions, events, payments, penalties, students } from "@attendance/db";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { materializeEventNoShows } from "@/lib/ledger";
import { recordPayment, updateSession } from "./actions";

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
  await requireOfficerOrGovernor();
  const { eventId } = await params;

  const event = await db.query.events.findFirst({ where: eq(events.id, eventId) });
  if (!event) notFound();

  // Give every no-show a real absent session + Penalty row so it shows here as
  // a payable row. Scoped to this Event, idempotent — safe to repeat.
  await materializeEventNoShows(event.id);

  const rows = await db
    .select({
      sessionId: attendanceSessions.id,
      half: attendanceSessions.half,
      timeIn: attendanceSessions.timeIn,
      timeOut: attendanceSessions.timeOut,
      studentName: students.name,
      studentIdText: students.studentId,
      penaltyId: penalties.id,
      penaltyAmount: penalties.amount,
      paidAt: payments.paidAt,
    })
    .from(attendanceSessions)
    .innerJoin(students, eq(attendanceSessions.studentId, students.id))
    .leftJoin(penalties, eq(penalties.attendanceSessionId, attendanceSessions.id))
    .leftJoin(payments, eq(payments.penaltyId, penalties.id))
    .where(eq(attendanceSessions.eventId, event.id))
    .orderBy(students.name, attendanceSessions.half);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 p-8">
      <h1 className="text-xl font-medium">{event.name} — Attendance</h1>
      <p className="text-muted-foreground text-sm">
        Half-day penalty: ₱{event.halfDayPenaltyAmount}
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-muted-foreground text-sm">No scans recorded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Half</TableHead>
                  <TableHead>Time in</TableHead>
                  <TableHead>Time out</TableHead>
                  <TableHead></TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Payment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.sessionId}>
                    <TableCell>
                      {row.studentName} ({row.studentIdText})
                    </TableCell>
                    <TableCell>{row.half.toUpperCase()}</TableCell>
                    <TableCell colSpan={3} className="p-0">
                      <form
                        action={updateSession}
                        className="grid grid-cols-[1fr_1fr_auto] items-center gap-2 p-2"
                      >
                        <input type="hidden" name="sessionId" value={row.sessionId} />
                        <Input
                          type="datetime-local"
                          name="timeIn"
                          defaultValue={toLocalInputValue(row.timeIn)}
                          className="text-xs"
                        />
                        <Input
                          type="datetime-local"
                          name="timeOut"
                          defaultValue={toLocalInputValue(row.timeOut)}
                          className="text-xs"
                        />
                        <Button type="submit" variant="ghost" size="sm">
                          Save
                        </Button>
                      </form>
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.penaltyAmount ? "destructive" : "secondary"}>
                        {row.penaltyAmount ? `Absent — ₱${row.penaltyAmount}` : "Present"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {row.penaltyId &&
                        (row.paidAt ? (
                          <Badge variant="default">Paid</Badge>
                        ) : (
                          <>
                            <form id={`record-payment-${row.penaltyId}`} action={recordPayment}>
                              <input type="hidden" name="penaltyId" value={row.penaltyId} />
                            </form>
                            <ConfirmSubmitButton
                              formId={`record-payment-${row.penaltyId}`}
                              title={`Mark ₱${row.penaltyAmount} as paid?`}
                              description={`Confirms ${row.studentName} settled this Penalty. There's no "unmark paid" action — undoing this means editing the database directly.`}
                              confirmLabel="Mark paid"
                              triggerLabel="Mark paid"
                            />
                          </>
                        ))}
                    </TableCell>
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
