const SCHOOL_EMAIL_DOMAIN = "@gbox.ncf.edu.ph";

export type OnboardingInput = {
  // Clerk's *verified primary* address, passed in as a plain string by the
  // caller — never a user-editable field, never a Clerk object (ADR 0012).
  email: string;
  name: string;
  program: string;
  studentId: string;
};

export type ValidationError = { field: string; message: string };

// The second of the two domain enforcement layers. Clerk's allowlist is a
// dashboard setting — invisible here and reversible from a console — so this
// one lives in version control, carries a test, and fails closed if that
// configuration ever drifts.
export function isSchoolEmail(verifiedEmail: string): boolean {
  return verifiedEmail.trim().toLowerCase().endsWith(SCHOOL_EMAIL_DOMAIN);
}

// Clerk's *verified primary* address — the only address the domain assertion
// may read; every other address field is user-editable. Structurally typed on
// purpose: no Clerk type crosses into this module.
export function verifiedPrimaryEmail(user: {
  primaryEmailAddressId: string | null;
  emailAddresses: {
    id: string;
    emailAddress: string;
    verification: { status: string | null } | null;
  }[];
}): string | null {
  const primary = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId);
  if (!primary || primary.verification?.status !== "verified") return null;
  return primary.emailAddress;
}

// validPrograms is the Governor-managed list (packages/db `programs` table),
// fetched by the caller — kept out of this pure function so it stays testable.
export function validateOnboarding(
  input: OnboardingInput,
  validPrograms: string[],
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!isSchoolEmail(input.email)) {
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

export const ALREADY_TAKEN =
  "That Student ID or email already belongs to another Student record. Ask a Governor to sort it out.";
