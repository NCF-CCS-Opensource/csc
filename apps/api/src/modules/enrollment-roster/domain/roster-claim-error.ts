export type RosterClaimReason =
  | "no-verified-email"
  | "not-school-email"
  | "no-student-id"
  | "no-match";

// Ported refusal reasons from apps/web/lib/enrollment-roster.ts and
// onboarding/actions.ts. Presentation/ maps `reason` to an HTTP status.
export class RosterClaimError extends Error {
  constructor(readonly reason: RosterClaimReason, message: string) {
    super(message);
  }
}
