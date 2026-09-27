import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const verifyToken = vi.fn();
vi.mock("@clerk/backend", () => ({ verifyToken: (...args: unknown[]) => verifyToken(...args) }));

describe("ClerkTokenVerifier (L-4: authorizedParties)", () => {
  const originalEnv = process.env.CLERK_AUTHORIZED_PARTIES;

  beforeEach(() => {
    verifyToken.mockReset();
    process.env.CLERK_SECRET_KEY = "sk_test_x";
  });
  afterEach(() => {
    if (originalEnv === undefined) delete process.env.CLERK_AUTHORIZED_PARTIES;
    else process.env.CLERK_AUTHORIZED_PARTIES = originalEnv;
  });

  it("defaults to the production origin and localhost when unset", async () => {
    delete process.env.CLERK_AUTHORIZED_PARTIES;
    const { ClerkTokenVerifier } = await import("./identity-token-verifier");
    verifyToken.mockResolvedValue({ sub: "user_1" });
    await new ClerkTokenVerifier().verify("token");
    expect(verifyToken).toHaveBeenCalledWith(
      "token",
      expect.objectContaining({
        authorizedParties: ["https://attendance.ncfccs.org", "http://localhost:3000"],
      }),
    );
  });

  it("honors a CLERK_AUTHORIZED_PARTIES override", async () => {
    process.env.CLERK_AUTHORIZED_PARTIES = "https://custom.example, https://second.example";
    vi.resetModules();
    const { ClerkTokenVerifier } = await import("./identity-token-verifier");
    verifyToken.mockResolvedValue({ sub: "user_1" });
    await new ClerkTokenVerifier().verify("token");
    expect(verifyToken).toHaveBeenCalledWith(
      "token",
      expect.objectContaining({
        authorizedParties: ["https://custom.example", "https://second.example"],
      }),
    );
  });

  it("returns null when Clerk rejects the authorized party (foreign-issued token)", async () => {
    vi.resetModules();
    const { ClerkTokenVerifier } = await import("./identity-token-verifier");
    verifyToken.mockRejectedValue(new Error("Invalid JWT Authorized party claim"));
    expect(await new ClerkTokenVerifier().verify("token")).toBeNull();
  });
});
