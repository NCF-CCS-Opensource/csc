import type { ValidationError } from "./onboarding";

// The correction itself now lives in apps/api's CorrectStudentUseCase
// (ADR-0019, #162). This error shape and the pure validator stay here: the
// error shape is what students/actions.ts maps an ApiError onto, and the
// validator keeps its own unit coverage (students.test.ts).
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
// (same split as validateOnboarding). Mirrors apps/api's
// CorrectStudentUseCase, which is the authoritative copy enforced server-side.
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
