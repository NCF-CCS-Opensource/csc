// A verified identity token yields the provider's subject id and nothing
// else — the domain never trusts a caller's claim about who they are.
export interface VerifiedToken {
  authUserId: string;
}

// Satisfied by infrastructure/identity-token-verifier.ts, which is the only
// place a vendor SDK (Clerk) is imported.
export interface TokenVerifier {
  verify(token: string): Promise<VerifiedToken | null>;
}

export const TOKEN_VERIFIER = Symbol("TokenVerifier");
