import { programs, semesters, students } from "@attendance/db";
import { asc, desc, ilike, or } from "drizzle-orm";
import { requireGovernor } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  addProgram,
  closeSemester,
  createSemester,
  editSemester,
  promoteToOfficer,
  removeProgram,
} from "./actions";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; q?: string }>;
}) {
  await requireGovernor();
  const { error, q } = await searchParams;

  const allSemesters = await db
    .select()
    .from(semesters)
    .orderBy(desc(semesters.createdAt));
  const allPrograms = await db.select().from(programs).orderBy(asc(programs.name));
  const searchResults = q
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

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 p-8">
      <h1 className="text-xl font-medium">Governor admin</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="flex flex-col gap-2">
        <h2 className="font-medium">Semesters</h2>
        <ul className="flex flex-col gap-1 text-sm">
          {allSemesters.map((semester) => (
            <li key={semester.id} className="flex items-center gap-2">
              <form action={editSemester} className="flex items-center gap-2">
                <input type="hidden" name="id" value={semester.id} />
                <input
                  type="date"
                  name="startDate"
                  defaultValue={semester.startDate}
                  disabled={!!semester.closedAt}
                  className="rounded border px-1 text-xs"
                />
                <input
                  type="date"
                  name="endDate"
                  defaultValue={semester.endDate}
                  disabled={!!semester.closedAt}
                  className="rounded border px-1 text-xs"
                />
                {!semester.closedAt && (
                  <button type="submit" className="text-xs underline">
                    Save
                  </button>
                )}
              </form>
              {semester.closedAt ? (
                <span className="text-xs text-zinc-500">closed</span>
              ) : (
                <form action={closeSemester}>
                  <input type="hidden" name="id" value={semester.id} />
                  <button type="submit" className="text-xs underline">
                    Close
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
        <form action={createSemester} className="flex items-end gap-2">
          <label className="flex flex-col text-xs">
            Start
            <input type="date" name="startDate" required className="rounded border px-1" />
          </label>
          <label className="flex flex-col text-xs">
            End
            <input type="date" name="endDate" required className="rounded border px-1" />
          </label>
          <button type="submit" className="rounded bg-black px-2 py-1 text-xs text-white">
            Create
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-medium">Programs</h2>
        <ul className="flex flex-col gap-1 text-sm">
          {allPrograms.map((program) => (
            <li key={program.id} className="flex items-center gap-2">
              {program.name}
              <form action={removeProgram}>
                <input type="hidden" name="id" value={program.id} />
                <button type="submit" className="text-xs underline">
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
        <form action={addProgram} className="flex gap-2">
          <input
            name="name"
            placeholder="Program name"
            required
            className="rounded border px-1 text-sm"
          />
          <button type="submit" className="rounded bg-black px-2 py-1 text-xs text-white">
            Add
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-medium">Promote a Student to Officer</h2>
        <form className="flex gap-2">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search name, email, or student ID"
            className="flex-1 rounded border px-1 text-sm"
          />
          <button type="submit" className="rounded bg-black px-2 py-1 text-xs text-white">
            Search
          </button>
        </form>
        <ul className="flex flex-col gap-1 text-sm">
          {searchResults.map((student) => (
            <li key={student.id} className="flex items-center gap-2">
              {student.name} — {student.email} ({student.role})
              {student.role === "student" && (
                <form action={promoteToOfficer}>
                  <input type="hidden" name="id" value={student.id} />
                  <button type="submit" className="text-xs underline">
                    Promote to Officer
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
