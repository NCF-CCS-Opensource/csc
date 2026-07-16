import { students } from "@attendance/db";
import { ilike, or } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireOfficerOrGovernor } from "@/lib/auth";
import { db } from "@/lib/db";
import { findOpenSemester } from "@/lib/events";
import { studentLedger } from "@/lib/ledger";

export const dynamic = "force-dynamic";

export default async function ClearancePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireOfficerOrGovernor();
  const { q } = await searchParams;

  const [openSemester, matches] = await Promise.all([
    findOpenSemester(),
    q
      ? db
          .select()
          .from(students)
          .where(
            or(
              ilike(students.name, `%${q}%`),
              ilike(students.email, `%${q}%`),
              ilike(students.studentId, `%${q}%`),
            ),
          )
          .limit(20)
      : Promise.resolve([]),
  ]);

  const results = await Promise.all(
    matches.map(async (student) => ({
      student,
      outstanding: openSemester
        ? (await studentLedger(openSemester.id, student.id)).outstanding
        : 0,
    })),
  );

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-8">
      <h1 className="text-xl font-medium">Clearance lookup</h1>
      {!openSemester && (
        <p className="text-muted-foreground text-sm">No open Semester — nothing to clear.</p>
      )}

      <form className="flex gap-2">
        <Input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search name, email, or student ID"
          className="flex-1"
        />
        <Button type="submit">Search</Button>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <p className="text-muted-foreground text-sm">No results yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead className="text-right">Clearance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map(({ student, outstanding }) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      {student.name} ({student.studentId})
                    </TableCell>
                    <TableCell>₱{outstanding.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={outstanding === 0 ? "default" : "destructive"}>
                        {outstanding === 0 ? "Clearance-ready" : "Not ready"}
                      </Badge>
                    </TableCell>
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
