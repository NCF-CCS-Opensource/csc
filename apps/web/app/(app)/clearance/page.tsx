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
    q
      ? apiPost<StudentListResponse>("student/list").then(({ students }) => students)
      : Promise.resolve([]),
  ]);

  const needle = q?.toLowerCase() ?? "";
  const matches = allStudents
    .filter(
      (student) =>
        student.name.toLowerCase().includes(needle) ||
        student.email.toLowerCase().includes(needle) ||
        student.studentId.toLowerCase().includes(needle),
    )
    .slice(0, 20);

  const results = await Promise.all(
    matches.map(async (student) => ({
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
