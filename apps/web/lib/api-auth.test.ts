import { describe, expect, it, vi } from "vitest";

const verifyToken = vi.hoisted(() => vi.fn());
vi.mock("@clerk/nextjs/server", () => ({ verifyToken }));
vi.mock("./db", () => ({ db: {} }));

import { getUserFromBearer } from "./api-auth";

const requestWith = (authorization?: string) =>
  new Request("https://example.test/api/me", {
    headers: authorization ? { authorization } : {},
  });

describe("getUserFromBearer", () => {
  it("returns the Clerk subject for a valid bearer token", async () => {
    verifyToken.mockResolvedValueOnce({ sub: "user_abc" });

    await expect(getUserFromBearer(requestWith("Bearer tok_123"))).resolves.toEqual({
      id: "user_abc",
    });
    expect(verifyToken).toHaveBeenCalledWith("tok_123", expect.anything());
  });

  it("returns null when the token fails verification", async () => {
    verifyToken.mockRejectedValueOnce(new Error("token expired"));

    await expect(getUserFromBearer(requestWith("Bearer tok_123"))).resolves.toBeNull();
  });

  it("returns null without an Authorization header", async () => {
    await expect(getUserFromBearer(requestWith())).resolves.toBeNull();
  });
});
