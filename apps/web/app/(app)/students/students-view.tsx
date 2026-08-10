"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
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
import { studentsSnapshot, type StudentsSnapshot } from "./actions";
import { studentsQueryKey } from "./query-key";

const ALL_PROGRAMS = "__all__";

const ROLE_LABEL: Record<string, string> = {
  student: "Student",
  officer: "Officer",
  governor: "Governor",
};

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
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{student.studentId}</TableCell>
                    <TableCell>{student.program}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={student.role === "student" ? "secondary" : "default"}>
                        {ROLE_LABEL[student.role]}
                      </Badge>
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
