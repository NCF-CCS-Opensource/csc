"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Download, Loader2 } from "lucide-react";
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

const ALL_PROGRAMS = "__all__";

const ROLE_LABEL: Record<string, string> = {
  student: "Student",
  officer: "Officer",
  governor: "Governor",
};

type StudentRow = StudentsSnapshot["students"][number];

// One row, editable in place (ADR-0014: any Officer or Governor may correct
// Student ID and Program directly, no approval workflow). Name, email, and
// role never appear in the edit form — there is nothing here to make them
// editable. Selection and QR Card download (spec #119) are owned by the
// parent — this row just renders the checkbox/button it's handed.
function StudentTableRow({
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
  onToggleSelected: (checked: boolean) => void;
  isDownloading: boolean;
  onDownload: () => void;
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

  const save = useMutation({
    mutationFn: () => correctStudent(student.id, { studentId, program }),
    onSuccess: (result) => {
      if (result.errors.length > 0) return;
      setEditing(false);
      setCardInvalidated(
        studentId.trim() !== student.studentId || program !== student.program,
      );
      queryClient.invalidateQueries({ queryKey: studentsQueryKey });
    },
  });

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
        onCheckedChange={(checked) => onToggleSelected(checked === true)}
        aria-label={`Select ${student.name}`}
      />
    </TableCell>
  );

  if (!editing) {
    return (
      <>
        <TableRow>
          {checkboxCell}
          <TableCell>{student.name}</TableCell>
          <TableCell>{student.email}</TableCell>
          <TableCell>{student.studentId}</TableCell>
          <TableCell>{student.program}</TableCell>
          <TableCell>
            <Badge variant={student.role === "student" ? "secondary" : "default"}>
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
            <Button variant="ghost" size="sm" disabled={isDownloading} onClick={onDownload}>
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
                <Button size="sm" disabled={isDownloading} onClick={onDownload}>
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
    <TableRow>
      {checkboxCell}
      <TableCell>{student.name}</TableCell>
      <TableCell>{student.email}</TableCell>
      <TableCell>
        <Input
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          className="w-32"
        />
        {errorFor("studentId") && (
          <p className="text-destructive text-xs">{errorFor("studentId")}</p>
        )}
      </TableCell>
      <TableCell>
        <Select value={program} onValueChange={setProgram}>
          <SelectTrigger className="w-full">
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
        <Badge variant={student.role === "student" ? "secondary" : "default"}>
          {ROLE_LABEL[student.role]}
        </Badge>
      </TableCell>
      <TableCell className="text-right" colSpan={2}>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={cancel}>
            Cancel
          </Button>
          <Button type="button" size="sm" disabled={save.isPending} onClick={() => save.mutate()}>
            Save
          </Button>
        </div>
        {formError && <p className="text-destructive text-xs">{formError}</p>}
      </TableCell>
    </TableRow>
  );
}

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

  function toggleOne(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

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

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-8">
      <h1 className="text-xl font-medium">Students</h1>

      <Card>
        <CardHeader>
          <CardTitle>Roster</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, or student ID"
              className="flex-1"
            />
            <Select value={program} onValueChange={setProgram}>
              <SelectTrigger className="w-56">
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
            <p className="text-muted-foreground text-sm">
              {selected.size > 0 ? `${selected.size} selected` : "No Students selected"}
            </p>
            <Button
              onClick={() =>
                download.mutate({ studentIds: Array.from(selected), filename: "qr-cards.pdf" })
              }
              disabled={isDownloading || selected.size === 0}
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
              className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800/50 dark:bg-red-950/30 dark:text-red-300"
            >
              Failed to generate QR Cards. Try again.
            </div>
          )}

          {filtered.length === 0 ? (
            <p className="text-muted-foreground text-sm">No Students match.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allFilteredSelected}
                      onCheckedChange={(checked) => toggleAllFiltered(checked === true)}
                      aria-label="Select all matching Students"
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead />
                  <TableHead className="text-right">QR Card</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((student) => (
                  <StudentTableRow
                    key={student.id}
                    student={student}
                    programs={data.programs}
                    selected={selected.has(student.id)}
                    onToggleSelected={(checked) => toggleOne(student.id, checked)}
                    isDownloading={isDownloading}
                    onDownload={() =>
                      download.mutate({
                        studentIds: [student.id],
                        filename: `${student.studentId}-qr-card.pdf`,
                      })
                    }
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
