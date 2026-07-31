export type Role = "student" | "officer" | "governor";
export type AppDestination =
  | "/dashboard"
  | "/events"
  | "/my-attendance"
  | "/clearance"
  | "/admin";

export const ROLE_DESTINATIONS: Record<Role, readonly AppDestination[]> = {
  student: ["/my-attendance"],
  officer: ["/dashboard", "/events", "/my-attendance", "/clearance"],
  governor: ["/dashboard", "/events", "/my-attendance", "/clearance", "/admin"],
};

export function dashboardDestination(role: Role): "/dashboard" | "/my-attendance" {
  return role === "student" ? "/my-attendance" : "/dashboard";
}

// Applied only at magic-link verification, when email ownership is proven —
// see auth/callback/route.ts. governorEmails is GOVERNOR_EMAILS, split by the caller.
export function determineRole(email: string, governorEmails: string[]): Role {
  const normalized = email.toLowerCase();
  const allowlist = governorEmails.map((e) => e.toLowerCase());
  return allowlist.includes(normalized) ? "governor" : "student";
}
