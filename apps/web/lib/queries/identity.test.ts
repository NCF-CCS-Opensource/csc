import { beforeEach, describe, expect, it, vi } from "vitest";

// Mirrors the mocking pattern used for the other shared fetchers (see
// open-semester.test.ts): mock getCurrentStudent (the same call the page's
// requireCapability gate makes) and assert getIdentity maps its result and
// stays a thin wrapper, plus that the query key stays stable (issue #285).
const { getCurrentStudent } = vi.hoisted(() => ({ getCurrentStudent: vi.fn() }));
vi.mock("@/lib/auth", () => ({ getCurrentStudent }));

import { getIdentity } from "./identity";
import { identityQueryKey } from "./identity.query-key";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getIdentity", () => {
  it("maps the caller's IdentityResponse to name/email/role", async () => {
    getCurrentStudent.mockResolvedValueOnce({
      studentId: "24-001",
      authUserId: "user_1",
      email: "student@example.com",
      name: "Grace Hopper",
      role: "student",
      program: "BSCS",
    });

    await expect(getIdentity()).resolves.toEqual({
      name: "Grace Hopper",
      email: "student@example.com",
      role: "student",
    });
  });

  it("reports no signed-in Student as null", async () => {
    getCurrentStudent.mockResolvedValueOnce(null);

    await expect(getIdentity()).resolves.toBeNull();
  });
});

describe("identityQueryKey", () => {
  it("is a stable key", () => {
    expect(identityQueryKey).toEqual(["identity"]);
  });
});
