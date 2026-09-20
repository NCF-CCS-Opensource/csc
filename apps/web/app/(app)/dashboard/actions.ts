"use server";

import { programs, students } from "@attendance/db";
import { count, inArray } from "drizzle-orm";
import { requireCapability } from "@/lib/auth";
import { db } from "@/lib/db";
import type { SemesterLedgerResponse, SemesterResponse } from "@attendance/contracts";
import { apiFetch } from "@/lib/api-client";

function findOpenSemester(): Promise<SemesterResponse | null> {
  return apiFetch<SemesterResponse | null>("/v1/api/semester/current");
}

export type DashboardSnapshot = {
  role: string;
  campusDate: string;
  openSemester: { id: string; startDate: string; endDate: string } | null;
  ledger: SemesterLedgerResponse;
  governorCounts: { officers: number; programs: number } | null;
};

// The Dashboard's one read, called by the server shell for the first paint and
// by the client cache's queryFn on every revisit (ADR 0013). No API route: this
// authorizes the browser session, leaving the booth's Bearer path untouched.
export async function dashboardSnapshot(): Promise<DashboardSnapshot> {
  const campusDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date());

  // requireCapability and findOpenSemester are independent reads — start both,
  // then branch once each result actually lands.
  const [student, openSemester] = await Promise.all([
    requireCapability("manage_operations"),
    findOpenSemester(),
  ]);

  const ledgerP = openSemester
    ? apiFetch<SemesterLedgerResponse>("/v1/api/ledger/semester", { semesterId: openSemester.id })
    : Promise.resolve({ events: [], totals: { present: 0, absent: 0, rate: 0, collected: 0 } });
  // ponytail-gap: no student-list/count endpoint exists on the API yet, so
  // this stays on direct DB access (see PR description's Known Gaps).
  const governorCountsP =
    student.role === "governor"
      ? Promise.all([
          db
            .select({ value: count() })
            .from(students)
            .where(inArray(students.role, ["officer", "governor"])),
          db.select({ value: count() }).from(programs),
        ])
      : Promise.resolve(null);

  const [ledger, governorCounts] = await Promise.all([ledgerP, governorCountsP]);

  return {
    role: student.role,
    campusDate,
    openSemester: openSemester
      ? {
          id: openSemester.id,
          startDate: openSemester.startDate,
          endDate: openSemester.endDate,
        }
      : null,
    ledger,
    governorCounts: governorCounts
      ? {
          officers: governorCounts[0][0].value,
          programs: governorCounts[1][0].value,
        }
      : null,
  };
}
