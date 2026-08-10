import { programs, students } from "@attendance/db";
import { eq } from "drizzle-orm";
import { db } from "./db";
import type { ValidationError } from "./onboarding";
import { hasCapability, type Role } from "./roles";

export class StudentCorrectionError extends Error {
  constructor(
    message: string,
    readonly field?: string,
  ) {
    super(message);
  }
}

export type StudentCorrectionInput = {
  studentId: string;
  program: string;
};

// validPrograms is the Governor-managed list (packages/db `programs` table),
// fetched by the caller — kept out of this pure function so it stays testable
// (same split as validateOnboarding).
export function validateStudentCorrection(
  input: StudentCorrectionInput,
  validPrograms: string[],
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (input.studentId.trim() === "") {
    errors.push({ field: "studentId", message: "Student ID is required" });
  }

  if (!validPrograms.includes(input.program)) {
    errors.push({ field: "program", message: "Select a valid Program" });
  }

  return errors;
}

// ADR-0014: any Officer or Governor may correct any Student's Student ID and
// Program directly — no approval workflow, no audit trail. Name, email, and
// role never pass through here: the input type has no room for them.
export async function correctStudent(
  actor: { role: Role },
  id: string,
  input: StudentCorrectionInput,
): Promise<typeof students.$inferSelect> {
  if (!hasCapability(actor.role, "manage_operations")) {
    throw new StudentCorrectionError("Forbidden");
  }

  const validPrograms = (
    await db.select({ name: programs.name }).from(programs)
  ).map((row) => row.name);
  const errors = validateStudentCorrection(input, validPrograms);
  if (errors[0]) throw new StudentCorrectionError(errors[0].message, errors[0].field);

  let updated: typeof students.$inferSelect | undefined;
  try {
    [updated] = await db
      .update(students)
      .set({ studentId: input.studentId.trim(), program: input.program })
      .where(eq(students.id, id))
      .returning();
  } catch (error) {
    // Collision on the unique Student ID — Postgres rejects the whole
    // statement, so the other Student's record is untouched too.
    if ((error as { code?: string }).code === "23505") {
      throw new StudentCorrectionError(
        "That Student ID already belongs to another Student",
        "studentId",
      );
    }
    throw error;
  }
  if (!updated) throw new StudentCorrectionError("Student not found");
  return updated;
}
