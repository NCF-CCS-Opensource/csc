import { scans, students } from "@attendance/db";
import { and, asc, desc, eq, ilike, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import Link from "next/link";
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
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Filter by Student or QR reference"
          className="flex-1 rounded border px-2 py-1 text-sm"
        />
        <input type="hidden" name="sort" value={sort ?? ""} />
        <button type="submit" className="rounded bg-black px-3 py-1 text-sm text-white">
          Filter
        </button>
      </form>

      <div className="flex gap-4 text-xs">
        <Link
          href={`/admin/rejections?${q ? `q=${encodeURIComponent(q)}&` : ""}sort=student`}
          className="underline"
        >
          Sort by Student
        </Link>
        <Link
          href={`/admin/rejections?${q ? `q=${encodeURIComponent(q)}&` : ""}sort=time`}
          className="underline"
        >
          Sort by time
        </Link>
      </div>

      <div className="flex flex-col gap-1 text-sm">
        {rows.length === 0 && (
          <p className="text-sm text-zinc-500">No rejected scans.</p>
        )}
        {rows.map((row) => (
          <div key={row.scanId} className="grid grid-cols-4 gap-2 border-t py-2">
            <span>
              {row.studentName ? `${row.studentName} (${row.studentIdText})` : "Unresolved QR"}
            </span>
            <span className="truncate text-xs text-zinc-500" title={row.qrPayload}>
              {row.qrPayload}
            </span>
            <span>{row.officerName}</span>
            <span>{new Date(row.scannedAt).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
