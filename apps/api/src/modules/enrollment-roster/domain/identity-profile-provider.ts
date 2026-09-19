export interface IdentityProfile {
  email: string;
  name: string;
}

// Satisfied by infrastructure/clerk-identity-profile.provider.ts, the only
// place the Clerk SDK is imported for this module. Only a verified primary
// address counts — mirrors apps/web/lib/onboarding.ts's verifiedPrimaryEmail
// (ADR-0019: the API never trusts a caller's claim about who they are).
export interface IdentityProfileProvider {
  getVerifiedProfile(authUserId: string): Promise<IdentityProfile | null>;
}

export const IDENTITY_PROFILE_PROVIDER = Symbol("IdentityProfileProvider");
