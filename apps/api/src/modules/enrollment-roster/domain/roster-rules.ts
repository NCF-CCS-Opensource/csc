// Ported from apps/web/lib/onboarding.ts and apps/web/lib/roles.ts
// (ADR-0019). Pure domain rules: no framework, database driver or vendor
// SDK import belongs here.

const SCHOOL_EMAIL_DOMAIN = "@gbox.ncf.edu.ph";

// testEmails is ONBOARDING_TEST_EMAILS, split by the caller — personal
// addresses let through for testing.
export function isSchoolEmail(verifiedEmail: string, testEmails: string[] = []): boolean {
  const normalized = verifiedEmail.trim().toLowerCase();
  return (
    normalized.endsWith(SCHOOL_EMAIL_DOMAIN) ||
    testEmails.map((e) => e.trim().toLowerCase()).includes(normalized)
  );
}

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

// governorEmails is GOVERNOR_EMAILS, split by the caller. Consulted only at
// Student-record creation, never again.
export function determineRole(email: string, governorEmails: string[]): "student" | "governor" {
  const normalized = email.toLowerCase();
  const allowlist = governorEmails.map((e) => e.toLowerCase());
  return allowlist.includes(normalized) ? "governor" : "student";
}
