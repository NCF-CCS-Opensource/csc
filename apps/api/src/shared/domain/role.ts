// Ported from apps/web/lib/roles.ts (ADR-0019: one capability policy, one
// place it's decided). No framework, database driver or vendor SDK import
// belongs in this file or anywhere else under domain/.
export type Role = "student" | "officer" | "governor";

export type Capability =
  | "view_own_attendance"
  | "manage_operations"
  | "administer"
  | "use_mobile_booth";

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

export function hasCapability(role: Role, capability: Capability): boolean {
  return ROLE_CAPABILITIES[role].includes(capability);
}

export type CapabilityDenial = "unauthenticated" | "forbidden";

// The single place authorization is decided (ADR-0017, ADR-0019). Presentation
// guards call this; they never decide themselves.
export function capabilityFailure(
  role: Role | null,
  capability: Capability,
): CapabilityDenial | null {
  if (!role) return "unauthenticated";
  return hasCapability(role, capability) ? null : "forbidden";
}
