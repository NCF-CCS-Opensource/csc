import type {
  EventResponse,
  SemesterListResponse,
  StudentListResponse,
} from "@attendance/contracts";
import { apiPost } from "@/lib/api-client";
import { requireCapability } from "@/lib/auth";
import { currentCampusDate } from "@/lib/ledger";
import { isEventPastInManila } from "@/lib/reports";
import { ReportsClient } from "./reports-client";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  await requireCapability("manage_operations");

  const campusDate = currentCampusDate();

  const [semesterList, eventsRows, studentList] = await Promise.all([
    apiPost<SemesterListResponse>("semester/list"),
    apiPost<EventResponse[]>("event/list"),
    apiPost<StudentListResponse>("student/list"),
  ]);

  // The API's own ordering is keyed off createdAt/name-only; re-sort here to
  // preserve this page's original date-based ordering exactly.
  const semestersRows = [...semesterList.semesters].sort((a, b) =>
    b.startDate.localeCompare(a.startDate),
  );

  const studentsRows = [...studentList.students].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  const eventsWithStatus = [...eventsRows]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((e) => ({
      id: e.id,
      name: e.name,
      date: e.date,
      semesterId: e.semesterId,
      isPast: isEventPastInManila(e.date, campusDate),
    }));

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <header className="border-b pb-5">
        <p className="text-primary text-xs font-semibold tracking-[0.18em] uppercase">
          CCS Institutional Reporting
        </p>
        <h1 className="font-display mt-1 text-3xl font-semibold tracking-tight">
          Reports
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Campus date: {campusDate}
        </p>
      </header>

      <ReportsClient
        semesters={semestersRows}
        events={eventsWithStatus}
        students={studentsRows}
        currentCampusDate={campusDate}
      />

    </main>
  );
}
