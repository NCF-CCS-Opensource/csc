import { events as eventsTable, semesters as semestersTable } from "@attendance/db";
import { desc } from "drizzle-orm";
import { requireCapability } from "@/lib/auth";
import { db } from "@/lib/db";
import { currentCampusDate } from "@/lib/ledger";
import { isEventPastInManila } from "@/lib/reports";
import { ReportsClient } from "./reports-client";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  await requireCapability("manage_operations");

  const campusDate = currentCampusDate();

  const [semestersRows, eventsRows] = await Promise.all([
    db.select({
      id: semestersTable.id,
      startDate: semestersTable.startDate,
      endDate: semestersTable.endDate,
      closedAt: semestersTable.closedAt,
    }).from(semestersTable).orderBy(desc(semestersTable.startDate)),
    db.select({
      id: eventsTable.id,
      name: eventsTable.name,
      date: eventsTable.date,
      semesterId: eventsTable.semesterId,
    }).from(eventsTable).orderBy(desc(eventsTable.date)),
  ]);

  const eventsWithStatus = eventsRows.map((e) => ({
    ...e,
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
        currentCampusDate={campusDate}
      />
    </main>
  );
}
