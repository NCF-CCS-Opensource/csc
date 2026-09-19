import { Injectable } from "@nestjs/common";
import { verifyToken } from "@clerk/backend";
import type { TokenVerifier, VerifiedToken } from "../domain/token-verifier";

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
      });
      return { authUserId: claims.sub };
    } catch {
      return null;
    }
  }
}
