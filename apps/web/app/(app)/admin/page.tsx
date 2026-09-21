import Link from "next/link";
import type {
  ProgramListDetailedResponse,
  SemesterListResponse,
  StudentListResponse,
  StudentSummary,
} from "@attendance/contracts";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Badge } from "@/components/ui/badge";
import {
  BentoCell,
  BentoGrid,
} from "@/components/ui/bento-grid";
import { Button } from "@/components/ui/button";
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
import { apiPost } from "@/lib/api-client";
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

  const [{ semesters: allSemesters }, { programs: allPrograms }, { students: allStudents }] =
    await Promise.all([
      apiPost<SemesterListResponse>("semester/list"),
      apiPost<ProgramListDetailedResponse>("program/list-detailed"),
      apiPost<StudentListResponse>("student/list"),
    ]);

  const needle = q?.toLowerCase() ?? "";
  const searchResults: StudentSummary[] = q
    ? allStudents
        .filter(
          (student) =>
            student.name.toLowerCase().includes(needle) ||
            student.email.toLowerCase().includes(needle) ||
            student.studentId.toLowerCase().includes(needle),
        )
        .slice(0, 20)
    : [];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 p-4 sm:p-6 lg:p-8 bg-[var(--bg-page)] min-h-[calc(100vh-3rem)]">
      {/* Editorial Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#888888]">
            EXECUTIVE GOVERNANCE
          </span>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground lowercase">
            governor admin
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Semester lifecycle management, program roster controls, and executive officer appointments.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="shadow-[var(--shadow-sm)]">
          <Link href="/admin/rejections">Rejected scans log</Link>
        </Button>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-[10px] border-2 border-border bg-red-50 p-4 text-sm text-red-800 shadow-[var(--shadow-sm)] dark:bg-red-950/30 dark:text-red-300"
        >
          {error}
        </div>
      )}

      {/* Modular Bento Grid Structure */}
      <BentoGrid className="w-full">
        {/* Cell 1: Dominant Hero Card for Semester Lifecycle */}
        <BentoCell
          colSpan={4}
          elevation="hero"
          overline="SEMESTER LIFECYCLE"
          title="semester lifecycle & date boundaries"
          description="Manage active semester date windows, close current semester, or initialize new terms."
          data-testid="semester-lifecycle-cell"
          className="flex flex-col gap-6"
        >
          <div className="rounded-[10px] border-2 border-border overflow-hidden bg-card shadow-[var(--shadow-sm)]">
            <Table>
              <TableHeader className="bg-[var(--bg-page)] border-b-2 border-border">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-bold uppercase tracking-[0.08em] text-foreground">
                    Date Boundaries (Start — End)
                  </TableHead>
                  <TableHead className="text-right text-xs font-bold uppercase tracking-[0.08em] text-foreground">
                    Lifecycle Status & Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allSemesters.map((semester) => (
                  <TableRow
                    key={semester.id}
                    className="border-b border-border/20 hover:bg-[var(--bg-page)]/40 transition-colors"
                  >
                    <TableCell className="p-3">
                      <form
                        action={editSemester}
                        className="flex flex-wrap items-center gap-3"
                      >
                        <input type="hidden" name="id" value={semester.id} />
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col gap-0.5">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                              Start
                            </Label>
                            <Input
                              type="date"
                              name="startDate"
                              defaultValue={semester.startDate}
                              aria-label="Start date"
                              className="w-36 text-xs border-2 border-border rounded-[8px] bg-card focus-visible:ring-2 focus-visible:ring-[var(--color-coral)] focus-visible:border-[var(--color-coral)]"
                            />
                          </div>
                          <span className="text-muted-foreground text-xs font-bold mt-4">
                            to
                          </span>
                          <div className="flex flex-col gap-0.5">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                              End
                            </Label>
                            <Input
                              type="date"
                              name="endDate"
                              defaultValue={semester.endDate}
                              aria-label="End date"
                              className="w-36 text-xs border-2 border-border rounded-[8px] bg-card focus-visible:ring-2 focus-visible:ring-[var(--color-coral)] focus-visible:border-[var(--color-coral)]"
                            />
                          </div>
                        </div>
                        <Button type="submit" variant="ghost" size="sm" className="mt-4 font-bold">
                          Save
                        </Button>
                      </form>
                    </TableCell>
                    <TableCell className="text-right p-3">
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        {semester.closedAt ? (
                          <Badge variant="secondary" className="shadow-[var(--shadow-sm)]">
                            Closed
                          </Badge>
                        ) : (
                          <>
                            <Badge variant="present" className="shadow-[var(--shadow-sm)]">
                              Active Term
                            </Badge>
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
          </div>

          {/* Initialize New Semester Form */}
          <div className="rounded-[10px] border-2 border-border bg-[var(--bg-page)]/50 p-4">
            <span className="text-xs font-bold uppercase tracking-[0.08em] text-foreground block mb-3">
              Initialize New Semester
            </span>
            <form action={createSemester} className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="startDate" className="text-xs font-bold text-foreground">
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  name="startDate"
                  required
                  className="w-40 border-2 border-border rounded-[8px] bg-card focus-visible:ring-2 focus-visible:ring-[var(--color-coral)] focus-visible:border-[var(--color-coral)]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="endDate" className="text-xs font-bold text-foreground">
                  End Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  name="endDate"
                  required
                  className="w-40 border-2 border-border rounded-[8px] bg-card focus-visible:ring-2 focus-visible:ring-[var(--color-coral)] focus-visible:border-[var(--color-coral)]"
                />
              </div>
              <Button type="submit" variant="default" className="font-bold">
                Create Semester
              </Button>
            </form>
          </div>
        </BentoCell>

        {/* Cell 2: Academic Rosters */}
        <BentoCell
          colSpan={2}
          elevation="standard"
          overline="ACADEMIC ROSTERS"
          title="degree program rosters"
          description="Recognized college degree programs available for student registration."
          data-testid="academic-rosters-cell"
          className="flex flex-col justify-between gap-4"
        >
          <div className="rounded-[10px] border-2 border-border overflow-hidden bg-card shadow-[var(--shadow-sm)]">
            <Table>
              <TableHeader className="bg-[var(--bg-page)] border-b-2 border-border">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-bold uppercase tracking-[0.08em] text-foreground">
                    Program Name
                  </TableHead>
                  <TableHead className="text-right text-xs font-bold uppercase tracking-[0.08em] text-foreground">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allPrograms.map((program) => (
                  <TableRow
                    key={program.id}
                    className="border-b border-border/20 hover:bg-[var(--bg-page)]/40 transition-colors"
                  >
                    <TableCell className="font-medium text-foreground py-3">
                      {program.name}
                    </TableCell>
                    <TableCell className="text-right py-3">
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
          </div>
          <form action={addProgram} className="flex gap-2">
            <Input
              name="name"
              placeholder="Program name"
              required
              aria-label="New program name"
              className="flex-1 border-2 border-border rounded-[8px] bg-card focus-visible:ring-2 focus-visible:ring-[var(--color-coral)] focus-visible:border-[var(--color-coral)] shadow-[var(--shadow-sm)]"
            />
            <Button type="submit" variant="default" className="font-bold">
              Add Program
            </Button>
          </form>
        </BentoCell>

        {/* Cell 3: Officer Roster */}
        <BentoCell
          colSpan={2}
          elevation="standard"
          overline="OFFICER ROSTER"
          title="appoint executive officers"
          description="Search student directory and grant executive officer capabilities."
          data-testid="officer-roster-cell"
          className="flex flex-col justify-between gap-4"
        >
          <form className="flex gap-2">
            <Input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search name, email, or student ID"
              aria-label="Search student to promote"
              className="flex-1 border-2 border-border rounded-[8px] bg-card focus-visible:ring-2 focus-visible:ring-[var(--color-coral)] focus-visible:border-[var(--color-coral)] shadow-[var(--shadow-sm)]"
            />
            <Button type="submit" variant="default" className="font-bold">
              Search
            </Button>
          </form>
          {searchResults.length > 0 && (
            <div className="rounded-[10px] border-2 border-border overflow-hidden bg-card shadow-[var(--shadow-sm)]">
              <Table>
                <TableHeader className="bg-[var(--bg-page)] border-b-2 border-border">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-bold uppercase tracking-[0.08em] text-foreground">
                      Candidate
                    </TableHead>
                    <TableHead className="text-right text-xs font-bold uppercase tracking-[0.08em] text-foreground">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchResults.map((student) => (
                    <TableRow
                      key={student.id}
                      className="border-b border-border/20 hover:bg-[var(--bg-page)]/40 transition-colors"
                    >
                      <TableCell className="py-3">
                        <div className="font-bold text-foreground">{student.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {student.email} • ({student.role})
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-3">
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
            </div>
          )}
        </BentoCell>
      </BentoGrid>
    </main>
  );
}
