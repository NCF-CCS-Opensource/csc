export const PROGRAMS = [
  "Computer Science",
  "Information Technology",
  "Information System",
  "ACT",
] as const;

export type Program = (typeof PROGRAMS)[number];

const SCHOOL_EMAIL_DOMAIN = "@gbox.ncf.edu.ph";

export type RegistrationInput = {
  email: string;
  program: Program;
  studentId: string;
};

export type ValidationError = { field: string; message: string };

export function validateRegistration(input: RegistrationInput): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!input.email.toLowerCase().endsWith(SCHOOL_EMAIL_DOMAIN)) {
    errors.push({
      field: "email",
      message: `Email must be a ${SCHOOL_EMAIL_DOMAIN} address`,
    });
  }

  if (!PROGRAMS.includes(input.program)) {
    errors.push({ field: "program", message: "Select a valid Program" });
  }

  if (input.studentId.trim() === "") {
    errors.push({ field: "studentId", message: "Student ID is required" });
  }

  return errors;
}

export type ExistingRegistration = { authUserId: string | null };

export type RegistrationAction =
  | { action: "create" }
  | { action: "resend" }
  | { action: "reject"; reason: string };

export function decideRegistrationAction(
  _input: RegistrationInput,
  existing: ExistingRegistration | null,
): RegistrationAction {
  if (!existing) return { action: "create" };
  if (existing.authUserId) {
    return {
      action: "reject",
      reason: "This email is already registered. Check your inbox or sign in.",
    };
  }
  return { action: "resend" };
}
