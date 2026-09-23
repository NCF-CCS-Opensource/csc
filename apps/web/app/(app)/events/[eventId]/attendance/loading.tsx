import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Student + two session columns (half-day shape) + Payment, matching the
// narrower of the two real grids so the skeleton never overstates width.
const COLUMNS = 4;
const ROWS = 6;

export default function AttendanceLoading() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-8">
      <Skeleton className="h-6 w-64" />
      <Skeleton className="h-4 w-48" />

      <Card>
        <CardHeader>
          <CardTitle>Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="mb-4 h-9 w-full max-w-xs" />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Session</TableHead>
                <TableHead>Session</TableHead>
                <TableHead className="text-right">Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: ROWS }).map((_, row) => (
                <TableRow key={row}>
                  {Array.from({ length: COLUMNS }).map((_, col) => (
                    <TableCell key={col}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
