import { SetMetadata } from "@nestjs/common";
import type { Capability } from "../domain/role";

export const CAPABILITY_KEY = "capability";

// Marks the single capability a route requires. Read only by CapabilityGuard
// (ADR-0019: the guard is the only place authorization is decided).
export const RequireCapability = (capability: Capability) =>
  SetMetadata(CAPABILITY_KEY, capability);
