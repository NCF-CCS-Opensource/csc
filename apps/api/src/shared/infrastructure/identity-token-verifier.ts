import { Injectable } from "@nestjs/common";
import { verifyToken } from "@clerk/backend";
import type { TokenVerifier, VerifiedToken } from "../domain/token-verifier";

// L-4: without this, a session token's `azp` (authorized party / issuing
// frontend origin) claim is never checked, so a token minted for ANY
// frontend of the same Clerk instance is accepted here. Clerk only enforces
// this claim when it's present on the token (native/mobile tokens typically
// carry no azp and are unaffected), so this is additive, not a new failure
// mode for the booth app. Overridable per deployment via env; defaults cover
// the documented production origin and local dev.
const DEFAULT_AUTHORIZED_PARTIES = [
  "https://attendance.ncfccs.org",
  "http://localhost:3000",
];

function authorizedParties(): string[] {
  const configured = process.env.CLERK_AUTHORIZED_PARTIES;
  return configured
    ? configured.split(",").map((party) => party.trim()).filter(Boolean)
    : DEFAULT_AUTHORIZED_PARTIES;
}

// Verifies against Clerk's published JWKS (ADR-0019). A missing, expired,
// tampered or foreign-signed token all fail the same way: null. That
// uniformity is what lets the guard answer 401 identically for all of them.
@Injectable()
export class ClerkTokenVerifier implements TokenVerifier {
  async verify(token: string): Promise<VerifiedToken | null> {
    if (!token) return null;
    try {
      const claims = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY!,
        authorizedParties: authorizedParties(),
      });
      return { authUserId: claims.sub };
    } catch {
      return null;
    }
  }
}
