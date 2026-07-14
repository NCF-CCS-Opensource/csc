import { attendanceSessions, events, payments, penalties, semesters, students } from "@attendance/db";
import { desc, eq, isNull } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/lib/db";
import { getSemesterPenaltySummary } from "@/lib/penalties";
import { isSessionAbsent } from "@/lib/scan";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    openSemester,
  ] = await Promise.all([
    supabase.auth.getUser(),
    db.query.semesters.findFirst({ where: isNull(semesters.closedAt) }),
  ]);

  if (!user) redirect("/register");

  const student = await db.query.students.findFirst({
    where: eq(students.authUserId, user.id),
  });
  if (!student) redirect("/register");

  const [attendanceHistory, paymentHistory] = await Promise.all([
    db
      .select({
        sessionId: attendanceSessions.id,
        eventName: events.name,
        half: attendanceSessions.half,
        timeIn: attendanceSessions.timeIn,
        timeOut: attendanceSessions.timeOut,
      })
      .from(attendanceSessions)
      .innerJoin(events, eq(attendanceSessions.eventId, events.id))
      .where(eq(attendanceSessions.studentId, student.id))
      .orderBy(desc(attendanceSessions.createdAt)),
    db
      .select({ id: payments.id, amount: payments.amount, paidAt: payments.paidAt })
      .from(payments)
      .innerJoin(penalties, eq(payments.penaltyId, penalties.id))
      .where(eq(penalties.studentId, student.id))
      .orderBy(desc(payments.paidAt)),
  ]);

  const { total: totalPenalty, outstanding } = openSemester
    ? await getSemesterPenaltySummary(student.id, openSemester.id)
    : { total: 0, outstanding: 0 };

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Welcome, {student.name}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <dl className="text-muted-foreground w-full text-sm">
            <div>Email: {student.email}</div>
            <div>Program: {student.program}</div>
            <div>Student ID: {student.studentId}</div>
          </dl>
          {/* eslint-disable-next-line @next/next/no-img-element -- generated PNG, not an optimizable static asset */}
          <img
            src="/qr"
            alt="Your attendance QR code"
            width={200}
            height={200}
            className="rounded-lg border"
          />
          <Button asChild variant="outline">
            <a href="/qr" download="attendance-qr.png">
              Download QR code
            </a>
          </Button>
          {(student.role === "officer" || student.role === "governor") && (
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild variant="secondary" size="sm">
                <Link href="/events">My Events</Link>
              </Button>
              <Button asChild variant="secondary" size="sm">
                <Link href="/clearance">Clearance lookup</Link>
              </Button>
              <Button asChild variant="secondary" size="sm">
                <Link href="/analytics">Analytics</Link>
              </Button>
              {student.role === "governor" && (
                <Button asChild variant="secondary" size="sm">
                  <Link href="/admin">Governor admin</Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>This Semester</CardTitle>
        </CardHeader>
        <CardContent>
          {openSemester ? (
            <p className="text-muted-foreground text-sm">
              Total penalties: ₱{totalPenalty.toFixed(2)} — Outstanding: ₱
              {outstanding.toFixed(2)}
            </p>
          ) : (
            <p className="text-muted-foreground text-sm">No open Semester.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance history</CardTitle>
        </CardHeader>
        <CardContent>
          {attendanceHistory.length === 0 ? (
            <p className="text-muted-foreground text-sm">No attendance recorded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceHistory.map((row) => (
                  <TableRow key={row.sessionId}>
                    <TableCell>
                      {row.eventName} ({row.half.toUpperCase()})
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={isSessionAbsent(row) ? "destructive" : "default"}>
                        {isSessionAbsent(row) ? "Absent" : "Present"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment history</CardTitle>
        </CardHeader>
        <CardContent>
          {paymentHistory.length === 0 ? (
            <p className="text-muted-foreground text-sm">No payments yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentHistory.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{new Date(payment.paidAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">₱{payment.amount}</TableCell>
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
