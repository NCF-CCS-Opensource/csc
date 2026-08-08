"use server";

import { payments, penalties } from "@attendance/db";
import { desc, eq } from "drizzle-orm";
import { requireCapability } from "@/lib/auth";
import { db } from "@/lib/db";
import { findOpenSemester } from "@/lib/events";
import { studentLedger, type StudentStanding } from "@/lib/ledger";

export type MyAttendanceSnapshot = {
  student: { name: string; email: string; program: string; studentId: string };
  hasOpenSemester: boolean;
  ledger: StudentStanding;
  paymentHistory: { id: string; amount: string; paidAt: string }[];
};

// My Attendance's one read, called by the server shell for the first paint and
// by the client cache's queryFn on every revisit (ADR 0013). No API route: this
// authorizes the browser session, leaving the booth's Bearer path untouched.
export async function myAttendanceSnapshot(): Promise<MyAttendanceSnapshot> {
  const [student, openSemester] = await Promise.all([
    requireCapability("view_own_attendance"),
    findOpenSemester(),
  ]);

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

  return {
    student: {
      name: student.name,
      email: student.email,
      program: student.program,
      studentId: student.studentId,
    },
    hasOpenSemester: openSemester !== null,
    ledger,
    paymentHistory: paymentHistory.map((payment) => ({
      ...payment,
      paidAt: new Date(payment.paidAt).toISOString(),
    })),
  };
}
