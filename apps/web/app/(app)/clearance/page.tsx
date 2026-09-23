import { requireOfficerOrGovernor } from "@/lib/auth";
import type {
  BatchStudentLedgerResponse,
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

  // One batched Ledger request for every enrolled Student instead of one
  // request per Student (issue #282; batched endpoint added in #278).
  const ledgerPromise = semesterPromise.then((semester) =>
    semester
      ? apiFetch<BatchStudentLedgerResponse>("/v1/api/ledger/students", {
          semesterId: semester.id,
        })
      : Promise.resolve<BatchStudentLedgerResponse>({}),
  );

  const [openSemester, allStudents, ledgerByStudentId] = await Promise.all([
    semesterPromise,
    studentsPromise,
    ledgerPromise,
  ]);

  const results = allStudents.map((student) => ({
    student,
    outstanding: ledgerByStudentId[student.id]?.outstanding ?? 0,
  }));

  return (
    <ClearanceView
      openSemester={openSemester}
      initialQuery={q ?? ""}
      initialResults={results}
    />
  );
}
