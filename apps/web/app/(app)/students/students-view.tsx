"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
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
import { studentsSnapshot, type StudentsSnapshot } from "./actions";
import { studentsQueryKey } from "./query-key";

const ALL_PROGRAMS = "__all__";

const ROLE_LABEL: Record<string, string> = {
  student: "Student",
  officer: "Officer",
  governor: "Governor",
};

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
                  <TableHead className="text-right">QR Card</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <Checkbox
                        checked={selected.has(student.id)}
                        onCheckedChange={(checked) => toggleOne(student.id, checked === true)}
                        aria-label={`Select ${student.name}`}
                      />
                    </TableCell>
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
                        variant="ghost"
                        size="sm"
                        disabled={isDownloading}
                        onClick={() =>
                          download.mutate({
                            studentIds: [student.id],
                            filename: `${student.studentId}-qr-card.pdf`,
                          })
                        }
                      >
                        <Download className="size-4" />
                      </Button>
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
