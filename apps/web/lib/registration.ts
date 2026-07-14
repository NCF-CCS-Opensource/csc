const SCHOOL_EMAIL_DOMAIN = "@gbox.ncf.edu.ph";

export type RegistrationInput = {
  email: string;
  name: string;
  program: string;
  studentId: string;
};

export type ValidationError = { field: string; message: string };

// validPrograms is the Governor-managed list (packages/db `programs` table),
// fetched by the caller — kept out of this pure function so it stays testable.
export function validateRegistration(
  input: RegistrationInput,
  validPrograms: string[],
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!input.email.toLowerCase().endsWith(SCHOOL_EMAIL_DOMAIN)) {
    errors.push({
      field: "email",
      message: `Email must be a ${SCHOOL_EMAIL_DOMAIN} address`,
    });
  }

  if (input.name.trim() === "") {
    errors.push({ field: "name", message: "Name is required" });
  }

  if (!validPrograms.includes(input.program)) {
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
