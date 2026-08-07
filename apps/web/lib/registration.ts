const SCHOOL_EMAIL_DOMAIN = "@gbox.ncf.edu.ph";
export const MIN_PASSWORD_LENGTH = 8;

export type RegistrationInput = {
  email: string;
  name: string;
  program: string;
  studentId: string;
  password: string;
  confirmPassword: string;
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

  if (input.password.length < MIN_PASSWORD_LENGTH) {
    errors.push({
      field: "password",
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    });
  } else if (input.password !== input.confirmPassword) {
    errors.push({ field: "confirmPassword", message: "Passwords don't match" });
  }

  return errors;
}

export const ALREADY_REGISTERED =
  "This email is already registered. Log in instead.";
