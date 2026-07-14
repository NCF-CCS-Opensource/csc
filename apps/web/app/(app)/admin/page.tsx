import { programs, semesters, students } from "@attendance/db";
import { asc, desc, ilike, or } from "drizzle-orm";
import Link from "next/link";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  addProgram,
  closeSemester,
  createSemester,
  deleteSemester,
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
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium">Governor admin</h1>
        <Button asChild variant="link" size="sm">
          <Link href="/admin/rejections">Rejected scans log</Link>
        </Button>
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Semesters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead></TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allSemesters.map((semester) => (
                <TableRow key={semester.id}>
                  <TableCell colSpan={3} className="p-0">
                    <form
                      action={editSemester}
                      className="grid grid-cols-[1fr_1fr_auto] items-center gap-2 p-2"
                    >
                      <input type="hidden" name="id" value={semester.id} />
                      <Input
                        type="date"
                        name="startDate"
                        defaultValue={semester.startDate}
                        className="text-xs"
                      />
                      <Input
                        type="date"
                        name="endDate"
                        defaultValue={semester.endDate}
                        className="text-xs"
                      />
                      <Button type="submit" variant="ghost" size="sm">
                        Save
                      </Button>
                    </form>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {semester.closedAt ? (
                        <Badge variant="secondary">Closed</Badge>
                      ) : (
                        <>
                          <form id={`close-semester-${semester.id}`} action={closeSemester}>
                            <input type="hidden" name="id" value={semester.id} />
                          </form>
                          <ConfirmSubmitButton
                            formId={`close-semester-${semester.id}`}
                            title="Close this Semester?"
                            description="Officers won't be able to create new Events under it, and you can't reopen it afterward — dates stay editable, but the Semester itself stays closed."
                            confirmLabel="Close"
                            triggerLabel="Close"
                          />
                        </>
                      )}
                      <form id={`delete-semester-${semester.id}`} action={deleteSemester}>
                        <input type="hidden" name="id" value={semester.id} />
                      </form>
                      <ConfirmSubmitButton
                        formId={`delete-semester-${semester.id}`}
                        title="Delete this Semester?"
                        description="This can't be undone. It only succeeds if no Events reference it yet."
                        confirmLabel="Delete"
                        triggerLabel="Delete"
                        triggerClassName="text-destructive"
                        actionVariant="destructive"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <form action={createSemester} className="flex items-end gap-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="startDate" className="text-xs">
                Start
              </Label>
              <Input id="startDate" type="date" name="startDate" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="endDate" className="text-xs">
                End
              </Label>
              <Input id="endDate" type="date" name="endDate" required />
            </div>
            <Button type="submit">Create</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Programs</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Table>
            <TableBody>
              {allPrograms.map((program) => (
                <TableRow key={program.id}>
                  <TableCell>{program.name}</TableCell>
                  <TableCell className="text-right">
                    <form id={`remove-program-${program.id}`} action={removeProgram}>
                      <input type="hidden" name="id" value={program.id} />
                    </form>
                    <ConfirmSubmitButton
                      formId={`remove-program-${program.id}`}
                      title={`Remove ${program.name}?`}
                      description="Students already registered under this Program are unaffected, but no one can select it going forward."
                      confirmLabel="Remove"
                      triggerLabel="Remove"
                      triggerClassName="text-destructive"
                      actionVariant="destructive"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <form action={addProgram} className="flex gap-2">
            <Input name="name" placeholder="Program name" required />
            <Button type="submit">Add</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Promote a Student to Officer</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form className="flex gap-2">
            <Input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search name, email, or student ID"
              className="flex-1"
            />
            <Button type="submit">Search</Button>
          </form>
          {searchResults.length > 0 && (
            <Table>
              <TableBody>
                {searchResults.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      {student.name} — {student.email} ({student.role})
                    </TableCell>
                    <TableCell className="text-right">
                      {student.role === "student" && (
                        <>
                          <form id={`promote-${student.id}`} action={promoteToOfficer}>
                            <input type="hidden" name="id" value={student.id} />
                          </form>
                          <ConfirmSubmitButton
                            formId={`promote-${student.id}`}
                            title={`Promote ${student.name} to Officer?`}
                            description="They'll be able to create Events, scan attendance, and mark Payments received. There's no demote action yet — undoing this means editing the database directly."
                            confirmLabel="Promote"
                            triggerLabel="Promote to Officer"
                          />
                        </>
                      )}
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
