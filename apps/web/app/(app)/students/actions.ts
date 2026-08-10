"use server";

import { programs, students } from "@attendance/db";
import { asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireOfficerOrGovernor } from "@/lib/auth";
import { db } from "@/lib/db";
import type { ValidationError } from "@/lib/onboarding";
import type { Role } from "@/lib/roles";
import {
  correctStudent as correctStudentCommand,
  StudentCorrectionError,
  type StudentCorrectionInput,
} from "@/lib/students";

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

// Corrects one Student's Student ID and Program in place (ADR-0014). Returns
// field errors instead of throwing — a thrown Error loses its `field` across
// the Server Action boundary, and the roster needs to know which input to
// blame.
export async function correctStudent(
  id: string,
  input: StudentCorrectionInput,
): Promise<{ errors: ValidationError[] }> {
  const actor = await requireOfficerOrGovernor();

  try {
    await correctStudentCommand(actor, id, input);
  } catch (error) {
    if (error instanceof StudentCorrectionError) {
      return { errors: [{ field: error.field ?? "form", message: error.message }] };
    }
    throw error;
  }

  revalidatePath("/students");
  return { errors: [] };
}
