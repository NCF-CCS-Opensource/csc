"use server";

import { payments, penalties, students } from "@attendance/db";
import { desc, eq } from "drizzle-orm";
import { requireCapability } from "@/lib/auth";
import { db } from "@/lib/db";
import type { SemesterResponse, StudentLedgerResponse } from "@attendance/contracts";
import { apiFetch } from "@/lib/api-client";

function findOpenSemester(): Promise<SemesterResponse | null> {
  return apiFetch<SemesterResponse | null>("/v1/api/semester/current");
}

export type MyAttendanceSnapshot = {
  student: { name: string; email: string; program: string; studentId: string };
  hasOpenSemester: boolean;
  ledger: StudentLedgerResponse;
  // paidOn is formatted here, not in the view: the date used to render on the
  // server, and formatting it in a client component would resolve it against
  // the viewer's locale and timezone instead — a different date either side of
  // midnight, and a hydration mismatch on the cell.
  paymentHistory: { id: string; amount: string; paidOn: string }[];
};

// My Attendance's one read, called by the server shell for the first paint and
// by the client cache's queryFn on every revisit (ADR 0013). No API route: this
// authorizes the browser session, leaving the booth's Bearer path untouched.
export async function myAttendanceSnapshot(): Promise<MyAttendanceSnapshot> {
  const [identity, openSemester] = await Promise.all([
    requireCapability("view_own_attendance"),
    findOpenSemester(),
  ]);

  // ponytail-gap: there's no API-side "payment history" read yet (ledger/mine
  // only totals + sessions), so that stays on a direct DB lookup by
  // authUserId (separate gap from #190 — no student/identity change closes
  // this one). identity.program (closed by #190/#185) covers the program
  // field, so the Student-row lookup that used to exist here is gone.
  const [ledger, paymentHistory] = await Promise.all([
    openSemester
      ? apiFetch<StudentLedgerResponse>("/v1/api/ledger/mine", { semesterId: openSemester.id })
      : Promise.resolve({ total: 0, outstanding: 0, sessions: [] }),
    db
      .select({ id: payments.id, amount: payments.amount, paidAt: payments.paidAt })
      .from(payments)
      .innerJoin(penalties, eq(payments.penaltyId, penalties.id))
      .innerJoin(students, eq(penalties.studentId, students.id))
      .where(eq(students.authUserId, identity.authUserId))
      .orderBy(desc(payments.paidAt)),
  ]);

  return {
    student: {
      name: identity.name,
      email: identity.email,
      program: identity.program,
      studentId: identity.studentId,
    },
    hasOpenSemester: openSemester !== null,
    ledger,
    paymentHistory: paymentHistory.map(({ id, amount, paidAt }) => ({
      id,
      amount,
      paidOn: new Date(paidAt).toLocaleDateString(),
    })),
  };
}
