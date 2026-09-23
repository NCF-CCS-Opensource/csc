import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Table-shaped placeholder for the Students route (spec #314): renders
// immediately via Next's route-level loading.tsx, before the server read in
// page.tsx resolves, so the navigation never appears to hang. Mirrors
// students-view.tsx's Card > header/filter row > 8-column table shape without
// depending on any of its data or client behavior.
const COLUMN_COUNT = 8;
const ROW_COUNT = 6;

export default function StudentsLoading() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8 bg-[var(--bg-page)] min-h-[calc(100vh-3rem)]">
      <header className="flex flex-col gap-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-96" />
      </header>

      <Card className="rounded-[10px] border-2 border-border bg-card shadow-[var(--shadow-md)] overflow-hidden">
        <CardHeader className="bg-[var(--bg-page)] border-b-2 border-border px-6 py-4">
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="flex flex-col gap-4 p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full sm:w-56" />
          </div>

          <div className="rounded-[10px] border-2 border-border overflow-hidden bg-card shadow-[var(--shadow-sm)]">
            <Table>
              <TableHeader className="bg-[var(--bg-page)] border-b-2 border-border">
                <TableRow className="hover:bg-transparent">
                  {Array.from({ length: COLUMN_COUNT }).map((_, index) => (
                    <TableHead key={`students-loading-head-${index}`}>
                      <Skeleton className="h-4 w-16" />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: ROW_COUNT }).map((_, rowIndex) => (
                  <TableRow key={`students-loading-row-${rowIndex}`} className="border-b border-border/20">
                    {Array.from({ length: COLUMN_COUNT }).map((_, colIndex) => (
                      <TableCell key={`students-loading-row-${rowIndex}-col-${colIndex}`}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
