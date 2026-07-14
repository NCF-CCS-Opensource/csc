import { describe, expect, it } from "vitest";
import {
  decideRegistrationAction,
  PROGRAMS,
  validateRegistration,
} from "./registration";

describe("validateRegistration", () => {
  const valid = {
    email: "student@gbox.ncf.edu.ph",
    name: "Juan Dela Cruz",
    program: "Computer Science" as const,
    studentId: "2021-00123",
  };

  it("accepts a well-formed registration", () => {
    expect(validateRegistration(valid)).toEqual([]);
  });

  it("rejects an email outside the school domain", () => {
    const errors = validateRegistration({ ...valid, email: "student@gmail.com" });
    expect(errors).toEqual([
      { field: "email", message: "Email must be a @gbox.ncf.edu.ph address" },
    ]);
  });

  it("rejects a program outside the fixed list", () => {
    // @ts-expect-error deliberately invalid program for the test
    const errors = validateRegistration({ ...valid, program: "Nursing" });
    expect(errors).toEqual([{ field: "program", message: "Select a valid Program" }]);
  });

  it("rejects a blank student id", () => {
    const errors = validateRegistration({ ...valid, studentId: "  " });
    expect(errors).toEqual([{ field: "studentId", message: "Student ID is required" }]);
  });

  it("rejects a blank name", () => {
    const errors = validateRegistration({ ...valid, name: "  " });
    expect(errors).toEqual([{ field: "name", message: "Name is required" }]);
  });

  it("collects multiple field errors at once", () => {
    const errors = validateRegistration({
      email: "bad",
      name: "",
      program: "Nursing" as never,
      studentId: "",
    });
    expect(errors.map((e) => e.field).sort()).toEqual([
      "email",
      "name",
      "program",
      "studentId",
    ]);
  });
});

describe("PROGRAMS", () => {
  it("matches the fixed Program list", () => {
    expect(PROGRAMS).toEqual([
      "Computer Science",
      "Information Technology",
      "Information System",
      "ACT",
    ]);
  });
});

describe("decideRegistrationAction", () => {
  const input = {
    email: "student@gbox.ncf.edu.ph",
    name: "Juan Dela Cruz",
    program: "Computer Science" as const,
    studentId: "2021-00123",
  };

  it("creates a new row when no existing registration", () => {
    expect(decideRegistrationAction(input, null)).toEqual({ action: "create" });
  });

  it("resends the magic link when the existing row is unverified", () => {
    expect(decideRegistrationAction(input, { authUserId: null })).toEqual({
      action: "resend",
    });
  });

  it("rejects when the existing row is already verified", () => {
    expect(decideRegistrationAction(input, { authUserId: "auth-123" })).toEqual({
      action: "reject",
      reason: "This email is already registered. Check your inbox or sign in.",
    });
  });
});
