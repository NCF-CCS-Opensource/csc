import { describe, expect, it, vi } from "vitest";
import { ApiError } from "./api";
import { isPermanentScanFailure } from "./scanErrors";

vi.mock("./api", () => ({
  ApiError: class ApiError extends Error {
    constructor(message: string, readonly status: number) {
      super(message);
    }
  },
}));

describe("isPermanentScanFailure", () => {
  it("treats stale-token 401s as transient, not permanent", () => {
    expect(isPermanentScanFailure(new ApiError("Unauthorized", 401))).toBe(
      false,
    );
  });

  it("treats timeouts and rate limits as transient", () => {
    expect(isPermanentScanFailure(new ApiError("Timed out", 408))).toBe(
      false,
    );
    expect(isPermanentScanFailure(new ApiError("Too many requests", 429))).toBe(
      false,
    );
  });

  it("treats server errors as transient", () => {
    expect(isPermanentScanFailure(new ApiError("Offline", 503))).toBe(false);
    expect(isPermanentScanFailure(new ApiError("Boom", 500))).toBe(false);
  });

  it("treats network failures that never reached the server as transient", () => {
    expect(isPermanentScanFailure(new TypeError("Network request failed"))).toBe(
      false,
    );
    expect(isPermanentScanFailure(undefined)).toBe(false);
  });

  it("treats a backend-confirmed non-matching payload (422) as permanent", () => {
    expect(isPermanentScanFailure(new ApiError("Unknown student", 422))).toBe(
      true,
    );
  });

  it("treats other definitive 4xx responses as permanent", () => {
    expect(isPermanentScanFailure(new ApiError("Bad request", 400))).toBe(
      true,
    );
    expect(isPermanentScanFailure(new ApiError("Forbidden", 403))).toBe(true);
    expect(isPermanentScanFailure(new ApiError("Not found", 404))).toBe(true);
  });
});
