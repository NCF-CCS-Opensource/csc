import { payments, penalties } from "@attendance/db";
import { desc, eq } from "drizzle-orm";
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
import { getCurrentStudent } from "@/lib/auth";
import { db } from "@/lib/db";
import { findOpenSemester } from "@/lib/events";
import { studentLedger } from "@/lib/ledger";

export const dynamic = "force-dynamic";

export default async function MyAttendancePage() {
  const [student, openSemester] = await Promise.all([
    getCurrentStudent(),
    findOpenSemester(),
  ]);
  if (!student) redirect("/register");

  // The Ledger folds full no-shows into the history and totals — no backfill,
  // no write on load. Attendance history is the Ledger's session breakdown.
  const [ledger, paymentHistory] = await Promise.all([
    openSemester
      ? studentLedger(openSemester.id, student.id)
      : Promise.resolve({ total: 0, outstanding: 0, sessions: [] }),
    db
      .select({ id: payments.id, amount: payments.amount, paidAt: payments.paidAt })
      .from(payments)
      .innerJoin(penalties, eq(payments.penaltyId, penalties.id))
      .where(eq(penalties.studentId, student.id))
      .orderBy(desc(payments.paidAt)),
  ]);

  const { total: totalPenalty, outstanding } = ledger;
  const attendanceHistory = ledger.sessions;

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
                  <TableRow key={`${row.eventId}:${row.half}`}>
                    <TableCell>
                      {row.eventName} ({row.half.toUpperCase()})
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          row.status === "absent"
                            ? "destructive"
                            : row.status === "incomplete"
                              ? "secondary"
                              : "default"
                        }
                      >
                        {row.status[0].toUpperCase() + row.status.slice(1)}
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
