"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
// editable.
function StudentTableRow({
  student,
  programs,
}: {
  student: StudentRow;
  programs: string[];
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [studentId, setStudentId] = useState(student.studentId);
  const [program, setProgram] = useState(student.program);

  const save = useMutation({
    mutationFn: () => correctStudent(student.id, { studentId, program }),
    onSuccess: (result) => {
      if (result.errors.length > 0) return;
      setEditing(false);
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

  if (!editing) {
    return (
      <TableRow>
        <TableCell>{student.name}</TableCell>
        <TableCell>{student.email}</TableCell>
        <TableCell>{student.studentId}</TableCell>
        <TableCell>{student.program}</TableCell>
        <TableCell className="text-right">
          <Badge variant={student.role === "student" ? "secondary" : "default"}>
            {ROLE_LABEL[student.role]}
          </Badge>
        </TableCell>
        <TableCell className="text-right">
          <Button type="button" variant="link" size="sm" onClick={() => setEditing(true)}>
            Correct
          </Button>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
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
      <TableCell className="text-right">
        <Badge variant={student.role === "student" ? "secondary" : "default"}>
          {ROLE_LABEL[student.role]}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
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

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-8">
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

          {filtered.length === 0 ? (
            <p className="text-muted-foreground text-sm">No Students match.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead className="text-right">Role</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((student) => (
                  <StudentTableRow key={student.id} student={student} programs={data.programs} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
