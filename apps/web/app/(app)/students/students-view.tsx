"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { memo, useCallback, useMemo, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { correctStudent, studentsSnapshot, type StudentsSnapshot } from "./actions";
import { studentsQueryKey } from "./query-key";

// Whether a correction to Student ID or Program invalidates a Student's
// already-printed QR Card: the card's payload is frozen at print time while the
// record is not, so any change to either makes the old card stop matching and
// fail Scan Approval. `current` is the persisted row (studentId already
// trimmed); `next` is the proposed edit, whose studentId is trimmed the same way
// correctStudent persists it, so a whitespace-only tweak isn't treated as a real
// change. Lives here (not lib/students, which pulls in the db client) so the
// `"use client"` view can gate on it without dragging server code into the
// bundle. The system records no QR Card issuance (ADR-0015), so every Student is
// treated as card-bearing and the gate is just "does the edit change a value".
function wouldInvalidateQrCard(
  current: { studentId: string; program: string },
  next: { studentId: string; program: string },
): boolean {
  return next.studentId.trim() !== current.studentId || next.program !== current.program;
}

const ALL_PROGRAMS = "__all__";

const ROLE_LABEL: Record<string, string> = {
  student: "Student",
  officer: "Officer",
  governor: "Governor",
};

function roleBadgeVariant(role: string): "secondary" | "default" | "cleared" {
  switch (role) {
    case "governor":
      return "cleared";
    case "officer":
      return "default";
    case "student":
    default:
      return "secondary";
  }
}

type StudentRow = StudentsSnapshot["students"][number];

// One row, editable in place (ADR-0014: any Officer or Governor may correct
// Student ID and Program directly, no approval workflow). Name, email, and
// role never appear in the edit form — there is nothing here to make them
// editable. Selection and QR Card download (spec #119) are owned by the
// parent — this row just renders the checkbox/button it's handed.
// Memoized so toggling one Student's checkbox doesn't re-render every other
// row in a roster that can run into the hundreds — onToggleSelected/onDownload
// are stable (id-based, not per-row closures), so only the row whose selected/
// isDownloading actually changed re-renders.
const StudentTableRow = memo(function StudentTableRow({
  student,
  programs,
  selected,
  onToggleSelected,
  isDownloading,
  onDownload,
}: {
  student: StudentRow;
  programs: string[];
  selected: boolean;
  onToggleSelected: (id: string, checked: boolean) => void;
  isDownloading: boolean;
  onDownload: (studentId: string, studentIdText: string) => void;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [studentId, setStudentId] = useState(student.studentId);
  const [program, setProgram] = useState(student.program);
  // Spec #121: a correction that actually changes a value freezes the
  // Student's already-printed QR Card (its payload was captured at print
  // time; the record wasn't). Nothing is persisted for this — the fix is
  // telling the Officer right here, in the same interaction, and handing
  // them the replacement download. Cleared on the next edit so it can't
  // linger past the correction it belongs to.
  const [cardInvalidated, setCardInvalidated] = useState(false);
  // Spec #143: before a correction that would invalidate a printed QR Card is
  // applied, the Officer confirms it in a modal (the card's payload is frozen
  // at print time, so ID/Program edits make it fail Scan Approval). Informational
  // and confirm-only — confirming applies the correction immediately, cancelling
  // leaves the record untouched (ADR-0014: no approval step, no audit trail).
  const [confirmOpen, setConfirmOpen] = useState(false);

  const save = useMutation({
    mutationFn: () => correctStudent(student.id, { studentId, program }),
    onSuccess: (result) => {
      if (result.errors.length > 0) return;
      setEditing(false);
      setCardInvalidated(wouldInvalidateQrCard(student, { studentId, program }));
      queryClient.invalidateQueries({ queryKey: studentsQueryKey });
    },
  });

  // The QR Card invalidation gate (spec #143): a Save that would actually
  // change Student ID or Program opens the confirmation modal first; a no-op
  // Save (or one that only re-types the same values) applies directly.
  function requestSave() {
    if (wouldInvalidateQrCard(student, { studentId, program })) {
      setConfirmOpen(true);
      return;
    }
    save.mutate();
  }

  const errorFor = (field: string) =>
    save.data?.errors.find((e) => e.field === field)?.message;
  // save.isError covers what the action can't hand back as a field error —
  // a thrown, unexpected failure (network blip, auth hiccup) — so a Save
  // never fails silently (see attendance-grid.tsx's ScanCell).
  const formError = errorFor("form") ?? (save.isError ? "Save failed" : undefined);

  function cancel() {
    setStudentId(student.studentId);
    setProgram(student.program);
    save.reset();
    setEditing(false);
  }

  const checkboxCell = (
    <TableCell>
      <Checkbox
        checked={selected}
        onCheckedChange={(checked) => onToggleSelected(student.id, checked === true)}
        aria-label={`Select ${student.name}`}
      />
    </TableCell>
  );

  if (!editing) {
    return (
      <>
        <TableRow className="border-b border-[#111111]/20 hover:bg-[var(--bg-page)]/40 transition-colors">
          {checkboxCell}
          <TableCell className="font-medium text-foreground">{student.name}</TableCell>
          <TableCell className="text-muted-foreground font-mono text-xs">{student.email}</TableCell>
          <TableCell>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-[6px] border border-[#111111] bg-[var(--bg-page)] text-[#111111]">
              {student.studentId}
            </span>
          </TableCell>
          <TableCell>{student.program}</TableCell>
          <TableCell>
            <Badge
              variant={roleBadgeVariant(student.role)}
              data-testid={`role-badge-${student.id}`}
              className="shadow-[var(--shadow-sm)]"
            >
              {ROLE_LABEL[student.role]}
            </Badge>
          </TableCell>
          <TableCell className="text-right">
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={() => {
                setCardInvalidated(false);
                setEditing(true);
              }}
            >
              Correct
            </Button>
          </TableCell>
          <TableCell className="text-right">
            <Button
              variant="ghost"
              size="sm"
              disabled={isDownloading}
              onClick={() => onDownload(student.id, student.studentId)}
            >
              <Download className="size-4" />
            </Button>
          </TableCell>
        </TableRow>
        {cardInvalidated && (
          <TableRow>
            {/* colSpan set past the real column count on purpose — browsers clamp
                it to the table's actual width, so the banner spans the row without
                a hand-counted number to keep in sync with the header. */}
            <TableCell colSpan={100} className="py-2">
              <div
                role="alert"
                className="flex items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-300"
              >
                <span>
                  {student.name}&apos;s printed QR Card no longer matches their record and will be
                  rejected at the booth. Hand them a replacement.
                </span>
                <Button
                  size="sm"
                  disabled={isDownloading}
                  onClick={() => onDownload(student.id, student.studentId)}
                >
                  <Download className="mr-2 size-4" />
                  Download replacement card
                </Button>
              </div>
            </TableCell>
          </TableRow>
        )}
      </>
    );
  }

  return (
    <>
      <TableRow className="border-b border-[#111111]/20 bg-[var(--bg-page)]/20">
        {checkboxCell}
        <TableCell className="font-medium text-foreground">{student.name}</TableCell>
        <TableCell className="text-muted-foreground font-mono text-xs">{student.email}</TableCell>
        <TableCell>
          <Input
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="w-32 border-2 border-[#111111] rounded-[8px] bg-white focus-visible:ring-2 focus-visible:ring-[var(--color-coral)] focus-visible:border-[var(--color-coral)]"
          />
          {errorFor("studentId") && (
            <p className="text-destructive text-xs">{errorFor("studentId")}</p>
          )}
        </TableCell>
        <TableCell>
        <Select value={program} onValueChange={setProgram}>
          <SelectTrigger className="w-full border-2 border-[#111111] rounded-[8px] bg-white focus-visible:ring-2 focus-visible:ring-[var(--color-coral)] focus-visible:border-[var(--color-coral)]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {programs.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errorFor("program") && (
          <p className="text-destructive text-xs">{errorFor("program")}</p>
        )}
      </TableCell>
      <TableCell>
        <Badge
          variant={roleBadgeVariant(student.role)}
          data-testid={`role-badge-${student.id}`}
          className="shadow-[var(--shadow-sm)]"
        >
          {ROLE_LABEL[student.role]}
        </Badge>
      </TableCell>
      <TableCell className="text-right" colSpan={2}>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={cancel}>
            Cancel
          </Button>
          <Button type="button" size="sm" disabled={save.isPending} onClick={requestSave}>
            Save
          </Button>
        </div>
        {formError && <p className="text-destructive text-xs">{formError}</p>}
      </TableCell>
    </TableRow>
    <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="border-2 border-[#111111] rounded-[12px] shadow-[6px_6px_0px_0px_#111111]">
          <AlertDialogHeader>
            <AlertDialogTitle>
              This correction invalidates {student.name}&apos;s printed QR Card
            </AlertDialogTitle>
            <AlertDialogDescription>
              The printed card&apos;s payload was frozen at print time and no longer matches
              this correction, so it will be rejected at Scan Approval. Confirm to apply the
              change — you&apos;ll hand the Student a replacement card.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmOpen(false);
                save.mutate();
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
  </>
);
});

// Single request path for a card download, one Student or many (spec #119):
// a bare <a download> gives no feedback across a multi-second bulk render, so
// this drives a fetch with a pending state instead, and disables every
// download control while any request is in flight so a slow render can't be
// fired twice from either the row or the toolbar.
async function downloadQrCards(studentIds: string[], filename: string) {
  const res = await fetch("/api/students/qr-cards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentIds }),
  });
  if (!res.ok) throw new Error("Failed to generate QR Cards");

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export function StudentsView({ initialData }: { initialData: StudentsSnapshot }) {
  // Seeded from the server shell, so a cold visit paints rendered HTML and a
  // revisit paints from cache while a background refetch replaces it.
  const { data } = useQuery({
    queryKey: studentsQueryKey,
    queryFn: studentsSnapshot,
    initialData,
  });

  const [search, setSearch] = useState("");
  const [program, setProgram] = useState(ALL_PROGRAMS);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.students.filter((student) => {
      const matchesSearch =
        q.length === 0 ||
        student.name.toLowerCase().includes(q) ||
        student.email.toLowerCase().includes(q) ||
        student.studentId.toLowerCase().includes(q);
      const matchesProgram = program === ALL_PROGRAMS || student.program === program;
      return matchesSearch && matchesProgram;
    });
  }, [data.students, search, program]);

  // Select-all covers everything matching the current search + Program
  // filter, not the whole roster — checkboxes then refine that set further.
  const allFilteredSelected =
    filtered.length > 0 && filtered.every((s) => selected.has(s.id));

  // Stable identity (functional setState, no closed-over state) so passing it
  // straight to every memoized row doesn't itself defeat the memo.
  const toggleOne = useCallback((id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  function toggleAllFiltered(checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const s of filtered) {
        if (checked) next.add(s.id);
        else next.delete(s.id);
      }
      return next;
    });
  }

  const download = useMutation({
    mutationFn: ({ studentIds, filename }: { studentIds: string[]; filename: string }) =>
      downloadQrCards(studentIds, filename),
  });
  const isDownloading = download.isPending;
  const { mutate: downloadMutate } = download;
  // Stable identity, same reason as toggleOne above.
  const downloadOne = useCallback(
    (studentId: string, studentIdText: string) =>
      downloadMutate({ studentIds: [studentId], filename: `${studentIdText}-qr-card.pdf` }),
    [downloadMutate],
  );

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8 bg-[var(--bg-page)] min-h-[calc(100vh-3rem)]">
      <header className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#888888]">
          STUDENT MANAGEMENT
        </span>
        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground lowercase">
          students
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage student rosters, correct identity records, and generate official QR pass cards.
        </p>
      </header>

      <Card className="rounded-[10px] border-2 border-[#111111] bg-white shadow-[var(--shadow-md)] overflow-hidden">
        <CardHeader className="bg-[var(--bg-page)] border-b-2 border-[#111111] px-6 py-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#888888]">
              STUDENT ROSTER
            </span>
            <CardTitle className="font-heading text-xl font-bold text-[#111111]">
              Roster
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, or student ID"
              aria-label="Search name, email, or student ID"
              className="flex-1 border-2 border-[#111111] rounded-[8px] bg-white focus-visible:ring-2 focus-visible:ring-[var(--color-coral)] focus-visible:border-[var(--color-coral)] shadow-[var(--shadow-sm)]"
            />
            <Select value={program} onValueChange={setProgram}>
              <SelectTrigger
                aria-label="Filter by program"
                className="w-full sm:w-56 border-2 border-[#111111] rounded-[8px] bg-white shadow-[var(--shadow-sm)] focus-visible:ring-2 focus-visible:ring-[var(--color-coral)] focus-visible:border-[var(--color-coral)]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_PROGRAMS}>All Programs</SelectItem>
                {data.programs.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm font-medium">
              {selected.size > 0 ? `${selected.size} selected` : "No Students selected"}
            </p>
            <Button
              onClick={() =>
                download.mutate({ studentIds: Array.from(selected), filename: "qr-cards.pdf" })
              }
              disabled={isDownloading || selected.size === 0}
              className="font-bold"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="mr-2 size-4" />
                  Download QR Cards
                </>
              )}
            </Button>
          </div>

          {download.isError && (
            <div
              role="alert"
              className="rounded-md border-2 border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800/50 dark:bg-red-950/30 dark:text-red-300 shadow-[var(--shadow-sm)]"
            >
              Failed to generate QR Cards. Try again.
            </div>
          )}

          {filtered.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">No Students match.</p>
          ) : (
            <div className="rounded-[10px] border-2 border-[#111111] overflow-hidden bg-white shadow-[var(--shadow-sm)]">
              <Table>
                <TableHeader className="bg-[var(--bg-page)] border-b-2 border-[#111111]">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-10 text-xs font-bold uppercase tracking-[0.08em] text-[#111111]">
                      <Checkbox
                        checked={allFilteredSelected}
                        onCheckedChange={(checked) => toggleAllFiltered(checked === true)}
                        aria-label="Select all matching Students"
                      />
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-[0.08em] text-[#111111]">Name</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-[0.08em] text-[#111111]">Email</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-[0.08em] text-[#111111]">Student ID</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-[0.08em] text-[#111111]">Program</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-[0.08em] text-[#111111]">Role</TableHead>
                    <TableHead />
                    <TableHead className="text-right text-xs font-bold uppercase tracking-[0.08em] text-[#111111]">QR Card</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((student) => (
                    <StudentTableRow
                      key={student.id}
                      student={student}
                      programs={data.programs}
                      selected={selected.has(student.id)}
                      onToggleSelected={toggleOne}
                      isDownloading={isDownloading}
                      onDownload={downloadOne}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
