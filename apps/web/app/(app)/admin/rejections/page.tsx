import { scans, students } from "@attendance/db";
import { and, asc, desc, eq, ilike, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import Link from "next/link";
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
import { requireGovernor } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function RejectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string }>;
}) {
  await requireGovernor();
  const { q, sort } = await searchParams;

  const officers = alias(students, "officers");

  const conditions = [eq(scans.result, "rejected")];
  if (q) {
    conditions.push(
      or(
        ilike(students.name, `%${q}%`),
        ilike(students.studentId, `%${q}%`),
        ilike(scans.qrPayload, `%${q}%`),
      )!,
    );
  }

  const rows = await db
    .select({
      scanId: scans.id,
      qrPayload: scans.qrPayload,
      scannedAt: scans.scannedAt,
      studentName: students.name,
      studentIdText: students.studentId,
      officerName: officers.name,
    })
    .from(scans)
    .leftJoin(students, eq(scans.studentId, students.id))
    .innerJoin(officers, eq(scans.officerId, officers.id))
    .where(and(...conditions))
    .orderBy(
      sort === "time" ? desc(scans.scannedAt) : asc(students.name),
    );

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-8">
      <h1 className="text-xl font-medium">Rejected scans</h1>

      <form className="flex gap-2">
        <Input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Filter by Student or QR reference"
          className="flex-1"
        />
        <input type="hidden" name="sort" value={sort ?? ""} />
        <Button type="submit">Filter</Button>
      </form>

      <div className="flex gap-4">
        <Button asChild variant="link" size="sm">
          <Link href={`/admin/rejections?${q ? `q=${encodeURIComponent(q)}&` : ""}sort=student`}>
            Sort by Student
          </Link>
        </Button>
        <Button asChild variant="link" size="sm">
          <Link href={`/admin/rejections?${q ? `q=${encodeURIComponent(q)}&` : ""}sort=time`}>
            Sort by time
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rejected scans</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-muted-foreground text-sm">No rejected scans.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>QR payload</TableHead>
                  <TableHead>Officer</TableHead>
                  <TableHead className="text-right">Scanned at</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.scanId}>
                    <TableCell>
                      {row.studentName
                        ? `${row.studentName} (${row.studentIdText})`
                        : "Unresolved QR"}
                    </TableCell>
                    <TableCell
                      className="text-muted-foreground max-w-40 truncate font-mono text-xs"
                      title={row.qrPayload}
                    >
                      {row.qrPayload}
                    </TableCell>
                    <TableCell>{row.officerName}</TableCell>
                    <TableCell className="text-right">
                      {new Date(row.scannedAt).toLocaleString()}
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
