"use client";

import { useQuery } from "@tanstack/react-query";
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
import { myAttendanceSnapshot, type MyAttendanceSnapshot } from "./actions";
import { myAttendanceQueryKey } from "./query-key";

export function MyAttendanceView({
  initialData,
}: {
  initialData: MyAttendanceSnapshot;
}) {
  // Seeded from the server shell, so a cold visit paints rendered HTML and a
  // revisit paints from cache while a background refetch replaces it.
  const { data } = useQuery({
    queryKey: myAttendanceQueryKey,
    queryFn: myAttendanceSnapshot,
    initialData,
  });
  const { student, hasOpenSemester, ledger, paymentHistory } = data;
  const { total: totalPenalty, outstanding, sessions: attendanceHistory } = ledger;

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
            <a href="/qr/card" download="qr-card.pdf">
              Download QR Card
            </a>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>This Semester</CardTitle>
        </CardHeader>
        <CardContent>
          {hasOpenSemester ? (
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
                    <TableCell>{payment.paidOn}</TableCell>
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
