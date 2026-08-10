"use server";

import { programs, students } from "@attendance/db";
import { asc } from "drizzle-orm";
import { requireOfficerOrGovernor } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Role } from "@/lib/roles";

export type StudentsSnapshot = {
  students: {
    id: string;
    name: string;
    email: string;
    studentId: string;
    program: string;
    role: Role;
  }[];
  programs: string[];
};

// The Students roster's one read, called by the server shell for the first
// paint and by the client cache's queryFn on every revisit (ADR 0013). No
// pagination: under 600 rows, filtered entirely client-side (spec #117).
export async function studentsSnapshot(): Promise<StudentsSnapshot> {
  await requireOfficerOrGovernor();

  const [allStudents, allPrograms] = await Promise.all([
    db
      .select({
        id: students.id,
        name: students.name,
        email: students.email,
        studentId: students.studentId,
        program: students.program,
        role: students.role,
      })
      .from(students)
      .orderBy(asc(students.name)),
    db.select({ name: programs.name }).from(programs).orderBy(asc(programs.name)),
  ]);

  return {
    students: allStudents,
    programs: allPrograms.map((p) => p.name),
  };
}
