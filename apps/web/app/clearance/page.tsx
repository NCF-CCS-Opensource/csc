import { semesters, students } from "@attendance/db";
import { ilike, isNull, or } from "drizzle-orm";
import { requireOfficerOrGovernor } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSemesterPenaltySummary } from "@/lib/penalties";

export const dynamic = "force-dynamic";

export default async function ClearancePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireOfficerOrGovernor();
  const { q } = await searchParams;

  const openSemester = await db.query.semesters.findFirst({
    where: isNull(semesters.closedAt),
  });

  const matches = q
    ? await db
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
    : [];

  const results = await Promise.all(
    matches.map(async (student) => ({
      student,
      outstanding: openSemester
        ? (await getSemesterPenaltySummary(student.id, openSemester.id)).outstanding
        : 0,
    })),
  );

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-8">
      <h1 className="text-xl font-medium">Clearance lookup</h1>
      {!openSemester && (
        <p className="text-sm text-zinc-500">No open Semester — nothing to clear.</p>
      )}

      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search name, email, or student ID"
          className="flex-1 rounded border px-2 py-1 text-sm"
        />
        <button type="submit" className="rounded bg-black px-3 py-1 text-sm text-white">
          Search
        </button>
      </form>

      <ul className="flex flex-col gap-1 text-sm">
        {results.map(({ student, outstanding }) => (
          <li key={student.id} className="flex items-center justify-between border-t py-2">
            <span>
              {student.name} ({student.studentId})
            </span>
            <span className="flex items-center gap-3">
              <span>₱{outstanding.toFixed(2)} outstanding</span>
              {outstanding === 0 ? (
                <span className="font-medium text-green-700">Clearance-ready</span>
              ) : (
                <span className="font-medium text-red-600">Not ready</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
