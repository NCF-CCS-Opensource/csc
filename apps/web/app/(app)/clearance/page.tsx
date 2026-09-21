import { requireOfficerOrGovernor } from "@/lib/auth";
import type {
  SemesterResponse,
  StudentLedgerResponse,
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

  const results = await Promise.all(
    allStudents.map(async (student) => ({
      student,
      outstanding: openSemester
        ? (
            await apiFetch<StudentLedgerResponse>("/v1/api/ledger/student", {
              semesterId: openSemester.id,
              studentId: student.id,
            })
          ).outstanding
        : 0,
    })),
  );

  return (
    <ClearanceView
      openSemester={openSemester}
      initialQuery={q ?? ""}
      initialResults={results}
    />
  );
}
