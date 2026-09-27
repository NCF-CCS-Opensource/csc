import { SetMetadata } from "@nestjs/common";
import type { Capability } from "../domain/role";

export const CAPABILITY_KEY = "capability";
export const PUBLIC_KEY = "public";

// Marks the single capability a route requires. Read only by CapabilityGuard
// (ADR-0019: the guard is the only place authorization is decided).
export const RequireCapability = (capability: Capability) =>
  SetMetadata(CAPABILITY_KEY, capability);

// Explicit opt-out for a route on a CapabilityGuard-protected controller
// that must stay reachable with no capability check (e.g. a health check).
// Without this, CapabilityGuard denies any route missing @RequireCapability.
export const Public = () => SetMetadata(PUBLIC_KEY, true);
