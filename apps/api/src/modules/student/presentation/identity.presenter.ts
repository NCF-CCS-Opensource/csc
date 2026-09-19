import type { IdentityResponse } from "@attendance/contracts";
import type { Actor } from "../../../shared/domain/actor";

export function presentIdentity(actor: Actor): IdentityResponse {
  return {
    studentId: actor.studentId,
    authUserId: actor.authUserId,
    email: actor.email,
    name: actor.name,
    role: actor.role,
  };
}
