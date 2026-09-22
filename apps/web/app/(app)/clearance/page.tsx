import { requireOfficerOrGovernor } from "@/lib/auth";
import type {
  SemesterOutstandingResponse,
  SemesterResponse,
  StudentListResponse,
} from "@attendance/contracts";
import { apiFetch, apiPost } from "@/lib/api-client";
import { ClearanceView } from "./clearance-view";

function findOpenSemester(): Promise<SemesterResponse | null> {
  return apiFetch<SemesterResponse | null>("/v1/api/semester/current");
}

export const dynamic = "force-dynamic";

export default async function ClearancePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireOfficerOrGovernor();
  const { q } = await searchParams;

  const [openSemester, allStudents] = await Promise.all([
    findOpenSemester(),
    apiPost<StudentListResponse>("student/list").then(({ students }) => students),
  ]);

  // One bulk fetch for every student's outstanding balance, not one per student
  // (that N+1 pattern used to time out the page for real student counts).
  const outstandingByStudent = openSemester
    ? await apiFetch<SemesterOutstandingResponse>("/v1/api/ledger/semester/outstanding", {
        semesterId: openSemester.id,
      })
    : {};

  const results = allStudents.map((student) => ({
    student,
    outstanding: outstandingByStudent[student.id] ?? 0,
  }));

  return (
    <ClearanceView
      openSemester={openSemester}
      initialQuery={q ?? ""}
      initialResults={results}
    />
  );
}
