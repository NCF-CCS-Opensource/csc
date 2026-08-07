import { describe, expect, it } from "vitest";
import { validateRegistration } from "./registration";

const PROGRAMS = [
  "Computer Science",
  "Information Technology",
  "Information System",
  "ACT",
];

describe("validateRegistration", () => {
  const valid = {
    email: "student@gbox.ncf.edu.ph",
    name: "Juan Dela Cruz",
    program: "Computer Science",
    studentId: "2021-00123",
    password: "correct-horse",
    confirmPassword: "correct-horse",
  };

  it("accepts a well-formed registration", () => {
    expect(validateRegistration(valid, PROGRAMS)).toEqual([]);
  });

  it("rejects an email outside the school domain", () => {
    const errors = validateRegistration(
      { ...valid, email: "student@gmail.com" },
      PROGRAMS,
    );
    expect(errors).toEqual([
      { field: "email", message: "Email must be a @gbox.ncf.edu.ph address" },
    ]);
  });

  it("rejects a program outside the Governor-managed list", () => {
    const errors = validateRegistration({ ...valid, program: "Nursing" }, PROGRAMS);
    expect(errors).toEqual([{ field: "program", message: "Select a valid Program" }]);
  });

  it("accepts a program the Governor added, even if not one of the original 4", () => {
    const errors = validateRegistration(
      { ...valid, program: "Nursing" },
      ["Nursing"],
    );
    expect(errors).toEqual([]);
  });

  it("rejects a blank student id", () => {
    const errors = validateRegistration({ ...valid, studentId: "  " }, PROGRAMS);
    expect(errors).toEqual([{ field: "studentId", message: "Student ID is required" }]);
  });

  it("rejects a blank name", () => {
    const errors = validateRegistration({ ...valid, name: "  " }, PROGRAMS);
    expect(errors).toEqual([{ field: "name", message: "Name is required" }]);
  });

  it("rejects a password shorter than the minimum", () => {
    const errors = validateRegistration(
      { ...valid, password: "short", confirmPassword: "short" },
      PROGRAMS,
    );
    expect(errors).toEqual([
      { field: "password", message: "Password must be at least 8 characters" },
    ]);
  });

  it("rejects mismatched password confirmation", () => {
    const errors = validateRegistration(
      { ...valid, confirmPassword: "different-password" },
      PROGRAMS,
    );
    expect(errors).toEqual([{ field: "confirmPassword", message: "Passwords don't match" }]);
  });

  it("collects multiple field errors at once", () => {
    const errors = validateRegistration(
      {
        email: "bad",
        name: "",
        program: "Nursing",
        studentId: "",
        password: "short",
        confirmPassword: "short",
      },
      PROGRAMS,
    );
    expect(errors.map((e) => e.field).sort()).toEqual([
      "email",
      "name",
      "password",
      "program",
      "studentId",
    ]);
  });
});
