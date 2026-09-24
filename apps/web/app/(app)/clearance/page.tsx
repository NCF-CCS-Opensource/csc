import { requireOfficerOrGovernor } from "@/lib/auth";
import type {
  BatchStudentLedgerResponse,
  SemesterListResponse,
  StudentListResponse,
} from "@attendance/contracts";
import { apiFetch, apiPost } from "@/lib/api-client";
import { getOpenSemester } from "@/lib/queries/open-semester";
import { ClearanceView } from "./clearance-view";

export const dynamic = "force-dynamic";

export default async function ClearancePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireOfficerOrGovernor();
  const { q } = await searchParams;

  // Kick off both immediately, and chain the Ledger request off the
  // Semester promise directly — it starts the moment openSemester resolves,
  // without waiting on the Student-list fetch (fixes the fetch waterfall,
  // issue #313).
  const semesterPromise = getOpenSemester();
  const studentsPromise = apiPost<StudentListResponse>("student/list").then(
    ({ students }) => students,
  );

  // Which Semester's Ledger gates Clearance. Normally the open one; once the
  // Governor closes it (the usual moment for clearance signing), fall back to
  // the most recently created Semester — with none open, that's the most
  // recently closed — so its unpaid Penalties still block Clearance instead
  // of every Student reading as ₱0 (TM-1).
  // ponytail: only the latest Semester is checked; debt left in older
  // Semesters needs a cross-Semester Ledger read if that ever matters.
  const ledgerSemesterPromise = semesterPromise.then(
    (semester) =>
      semester ??
      apiPost<SemesterListResponse>("semester/list").then(
        ({ semesters }) => semesters[0] ?? null,
      ),
  );

  // One batched Ledger request for every enrolled Student instead of one
  // request per Student (issue #282; batched endpoint added in #278).
  const ledgerPromise = ledgerSemesterPromise.then((semester) =>
    semester
      ? apiFetch<BatchStudentLedgerResponse>("/v1/api/ledger/students", {
          semesterId: semester.id,
        })
      : Promise.resolve<BatchStudentLedgerResponse>({}),
  );

  const [openSemester, ledgerSemester, allStudents, ledgerByStudentId] =
    await Promise.all([
      semesterPromise,
      ledgerSemesterPromise,
      studentsPromise,
      ledgerPromise,
    ]);

  // Fail closed: a Student with no Ledger entry has an unknown balance, never
  // ₱0 — the view renders null as "Not ready".
  const results = allStudents.map((student) => ({
    student,
    outstanding: ledgerByStudentId[student.id]?.outstanding ?? null,
  }));

  return (
    <ClearanceView
      openSemester={openSemester}
      ledgerSemester={ledgerSemester}
      initialQuery={q ?? ""}
      initialResults={results}
    />
  );
}
