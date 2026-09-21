"use server";

import { revalidatePath } from "next/cache";
import { requireOfficerOrGovernor } from "@/lib/auth";
import { apiPost, ApiError } from "@/lib/api-client";
import type { ValidationError } from "@/lib/onboarding";
import type { Role } from "@/lib/roles";
import type { StudentCorrectionInput } from "@/lib/students";

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
// Both the Program list (#162) and the Student list (#186) are now API-backed.
export async function studentsSnapshot(): Promise<StudentsSnapshot> {
  await requireOfficerOrGovernor();

  const [{ students: allStudents }, { programs }] = await Promise.all([
    apiPost<{ students: StudentsSnapshot["students"] }>("student/list"),
    apiPost<{ programs: string[] }>("program/list"),
  ]);

  return {
    students: allStudents,
    programs,
  };
}

// Corrects one Student's Student ID and Program in place (ADR-0014, #162).
// Returns field errors instead of throwing — a thrown Error loses its
// `field` across the Server Action boundary, and the roster needs to know
// which input to blame.
export async function correctStudent(
  id: string,
  input: StudentCorrectionInput,
): Promise<{ errors: ValidationError[] }> {
  await requireOfficerOrGovernor();

  try {
    await apiPost(`student/correct/${id}`, input);
  } catch (error) {
    if (error instanceof ApiError) {
      return { errors: [{ field: error.field ?? "form", message: error.message }] };
    }
    throw error;
  }

  revalidatePath("/students");
  return { errors: [] };
}
