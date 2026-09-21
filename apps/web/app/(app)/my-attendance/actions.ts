"use server";

import { requireCapability } from "@/lib/auth";
import type { PaymentHistoryEntry, SemesterResponse, StudentLedgerResponse } from "@attendance/contracts";
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

  const [ledger, paymentHistory] = await Promise.all([
    openSemester
      ? apiFetch<StudentLedgerResponse>("/v1/api/ledger/mine", { semesterId: openSemester.id })
      : Promise.resolve({ total: 0, outstanding: 0, sessions: [] }),
    apiFetch<PaymentHistoryEntry[]>("/v1/api/ledger/mine/history"),
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
