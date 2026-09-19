import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOfficerOrGovernor } from "@/lib/auth";
import { ApiError, apiFetch } from "@/lib/api-client";
import type { AttendanceGridResponse } from "@attendance/contracts";
import { AttendanceGrid } from "./attendance-grid";

export const dynamic = "force-dynamic";

export default async function AttendancePage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  await requireOfficerOrGovernor();
  const { eventId } = await params;

  let snapshot: AttendanceGridResponse;
  try {
    await apiFetch("/v1/api/attendance/materialize-no-shows", { eventId });
    snapshot = await apiFetch("/v1/api/attendance/grid", { eventId });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-8">
      <h1 className="text-xl font-medium">{snapshot.event.name} — Attendance</h1>
      <p className="text-muted-foreground text-sm">
        Half-day penalty: ₱{snapshot.event.halfDayPenaltyAmount}
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          {snapshot.rows.length === 0 ? (
            <p className="text-muted-foreground text-sm">No liable Students for this Event.</p>
          ) : (
            <AttendanceGrid eventId={snapshot.event.id} initialRows={snapshot.rows} />
          )}
        </CardContent>
      </Card>
    </main>
  );
}
