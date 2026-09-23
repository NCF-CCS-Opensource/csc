const SCHOOL_EMAIL_DOMAIN = "@gbox.ncf.edu.ph";

// Shared with page.tsx and actions.ts so the allowlist has one source of
// truth — a mismatch between the two would reopen the gap this file exists
// to close.
export const ONBOARDING_TEST_EMAILS = (process.env.ONBOARDING_TEST_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim())
  .filter(Boolean);

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
// testEmails is ONBOARDING_TEST_EMAILS, split by the caller (same shape as
// GOVERNOR_EMAILS/determineRole) — personal addresses let through for
// testing. Also needs a matching allowlist exception in Clerk's dashboard
// (Configure > Restrictions), which is the layer that actually gates sign-in;
// this one only controls whether onboarding accepts the address afterward.
export function isSchoolEmail(verifiedEmail: string, testEmails: string[] = []): boolean {
  const normalized = verifiedEmail.trim().toLowerCase();
  return (
    normalized.endsWith(SCHOOL_EMAIL_DOMAIN) ||
    testEmails.map((e) => e.trim().toLowerCase()).includes(normalized)
  );
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
  testEmails: string[] = [],
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!isSchoolEmail(input.email, testEmails)) {
    errors.push({
      field: "email",
      message: `Email must be a ${SCHOOL_EMAIL_DOMAIN} address`,
    });
  }

  if (input.name.trim() === "") {
    // Google supplies the name, so this is not a field the form can fix —
    // say where it actually comes from.
    errors.push({
      field: "name",
      message: "Your Google account has no name set. Add one, then sign in again.",
    });
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
  "That Student ID or email already belongs to another Student record. An Officer or Governor can correct it from the Students page.";

// Google may omit a middle name, preserve different casing, or use accents.
// Compare only whole first/last-name tokens; never fuzzy-match a roster claim.
const nameTokens = (name: string) =>
  name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase()
    .match(/[\p{L}\p{N}]+/gu) ?? [];

export function rosterNameMatches(
  googleName: string,
  rosterName: { firstName: string; lastName: string },
): boolean {
  const googleTokens = new Set(nameTokens(googleName));
  const firstTokens = nameTokens(rosterName.firstName);
  const lastTokens = nameTokens(rosterName.lastName);
  return (
    firstTokens.length > 0 &&
    lastTokens.length > 0 &&
    firstTokens.every((token) => googleTokens.has(token)) &&
    lastTokens.every((token) => googleTokens.has(token))
  );
}
