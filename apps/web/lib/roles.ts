export type Role = "student" | "officer" | "governor";

// Applied only at magic-link verification, when email ownership is proven —
// see auth/callback/route.ts. governorEmails is GOVERNOR_EMAILS, split by the caller.
export function determineRole(email: string, governorEmails: string[]): Role {
  const normalized = email.toLowerCase();
  const allowlist = governorEmails.map((e) => e.toLowerCase());
  return allowlist.includes(normalized) ? "governor" : "student";
}
