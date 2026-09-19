import { Injectable } from "@nestjs/common";
import { createClerkClient } from "@clerk/backend";
import type { IdentityProfile, IdentityProfileProvider } from "../domain/identity-profile-provider";

// The only place the Clerk SDK is imported for this module. Mirrors
// apps/web/lib/onboarding.ts's verifiedPrimaryEmail: only a verified
// primary address counts (ADR-0019), every other address field is
// user-editable and ignored.
@Injectable()
export class ClerkIdentityProfileProvider implements IdentityProfileProvider {
  private readonly clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

  async getVerifiedProfile(authUserId: string): Promise<IdentityProfile | null> {
    const user = await this.clerk.users.getUser(authUserId);
    const email = user.primaryEmailAddress;
    if (!email || email.verification?.status !== "verified") return null;

    return {
      email: email.emailAddress,
      name: user.fullName?.trim() ?? [user.firstName, user.lastName].filter(Boolean).join(" "),
    };
  }
}
