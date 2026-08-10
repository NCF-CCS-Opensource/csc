import { events } from "@attendance/db";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOfficerOrGovernor } from "@/lib/auth";
import { db } from "@/lib/db";
import { eventGrid } from "./actions";
import { AttendanceGrid } from "./attendance-grid";

export const dynamic = "force-dynamic";

export default async function AttendancePage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  await requireOfficerOrGovernor();
  const { eventId } = await params;

  const event = await db.query.events.findFirst({ where: eq(events.id, eventId) });
  if (!event) notFound();

  // The same read the client cache refetches through, so the shell's rows and
  // the cache's rows can never disagree in shape (ADR 0013).
  const rows = await eventGrid(event.id);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-8">
      <h1 className="text-xl font-medium">{event.name} — Attendance</h1>
      <p className="text-muted-foreground text-sm">
        Half-day penalty: ₱{event.halfDayPenaltyAmount}
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-muted-foreground text-sm">No liable Students for this Event.</p>
          ) : (
            <AttendanceGrid eventId={event.id} initialRows={rows} />
          )}
        </CardContent>
      </Card>
    </main>
  );
}
