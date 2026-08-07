export type Role = "student" | "officer" | "governor";
export type Capability =
  | "view_own_attendance"
  | "manage_operations"
  | "administer"
  | "use_mobile_booth";
export type AppDestination =
  | "/dashboard"
  | "/events"
  | "/my-attendance"
  | "/clearance"
  | "/admin"
  | "/analytics";

const ROLE_CAPABILITIES: Record<Role, readonly Capability[]> = {
  student: ["view_own_attendance"],
  officer: ["view_own_attendance", "manage_operations", "use_mobile_booth"],
  governor: [
    "view_own_attendance",
    "manage_operations",
    "administer",
    "use_mobile_booth",
  ],
};

const DESTINATIONS: readonly [AppDestination, Capability][] = [
  ["/dashboard", "manage_operations"],
  ["/events", "manage_operations"],
  ["/my-attendance", "view_own_attendance"],
  ["/clearance", "manage_operations"],
  ["/admin", "administer"],
  ["/analytics", "manage_operations"],
];

export function hasCapability(role: Role, capability: Capability): boolean {
  return ROLE_CAPABILITIES[role].includes(capability);
}

export function capabilityFailure(
  role: Role | null,
  capability: Capability,
): "unauthenticated" | "forbidden" | null {
  if (!role) return "unauthenticated";
  return hasCapability(role, capability) ? null : "forbidden";
}

export function destinationsForRole(role: Role): AppDestination[] {
  return DESTINATIONS.filter(([, capability]) => hasCapability(role, capability)).map(
    ([destination]) => destination,
  );
}

export function dashboardDestination(role: Role): "/dashboard" | "/my-attendance" {
  return hasCapability(role, "manage_operations") ? "/dashboard" : "/my-attendance";
}

// Applied only at Student-record creation, against Clerk's verified primary
// address — see onboarding/actions.ts. Consulted once and never again: a
// Governor whose address was missing then needs a manual database edit
// (docs/setup/provisioning.md). governorEmails is GOVERNOR_EMAILS, split by the caller.
export function determineRole(email: string, governorEmails: string[]): Role {
  const normalized = email.toLowerCase();
  const allowlist = governorEmails.map((e) => e.toLowerCase());
  return allowlist.includes(normalized) ? "governor" : "student";
}
