import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireOfficerOrGovernor } from "@/lib/auth";
import { findOpenSemester } from "@/lib/events";
import { semesterLedger } from "@/lib/ledger";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const officer = await requireOfficerOrGovernor();

  const openSemester = await findOpenSemester();

  if (!openSemester) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-8">
        <h1 className="text-xl font-medium">Analytics</h1>
        <p className="text-muted-foreground text-sm">No open Semester.</p>
      </main>
    );
  }

  // Governor sees every Officer's Events rolled up; an Officer sees only their
  // own. The Ledger counts full no-shows too, not just Students with rows.
  const { events: stats, totals } = await semesterLedger(
    openSemester.id,
    officer.role === "governor" ? "all" : { officerId: officer.id },
  );

  const {
    present: totalPresent,
    absent: totalAbsent,
    rate: totalRate,
    collected: totalCollected,
  } = totals;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-8">
      <h1 className="text-xl font-medium">
        {officer.role === "governor" ? "Analytics — all Officers" : "Analytics — my Events"}
      </h1>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground text-sm font-normal">
              Present / Absent
            </CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-medium">
            {totalPresent} / {totalAbsent}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground text-sm font-normal">
              Attendance rate
            </CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-medium">{totalRate.toFixed(1)}%</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground text-sm font-normal">
              Collected
            </CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-medium">
            ₱{totalCollected.toFixed(2)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Events</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.length === 0 ? (
            <p className="text-muted-foreground text-sm">No Events this Semester.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Present / Absent</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead className="text-right">Collected</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.map(({ eventId, name, present, absent, rate, collected }) => (
                  <TableRow key={eventId}>
                    <TableCell>{name}</TableCell>
                    <TableCell>
                      {present} / {absent}
                    </TableCell>
                    <TableCell>{rate.toFixed(1)}%</TableCell>
                    <TableCell className="text-right">₱{collected.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
