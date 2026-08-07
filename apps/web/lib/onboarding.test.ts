import { describe, expect, it } from "vitest";
import { isSchoolEmail, validateOnboarding, verifiedPrimaryEmail } from "./onboarding";

describe("verifiedPrimaryEmail", () => {
  const primary = {
    id: "idn_primary",
    emailAddress: "student@gbox.ncf.edu.ph",
    verification: { status: "verified" },
  };
  const other = {
    id: "idn_other",
    emailAddress: "student@gmail.com",
    verification: { status: "verified" },
  };

  it("returns the verified primary address", () => {
    expect(
      verifiedPrimaryEmail({
        primaryEmailAddressId: "idn_primary",
        emailAddresses: [other, primary],
      }),
    ).toBe("student@gbox.ncf.edu.ph");
  });

  it("ignores a non-primary address, however verified", () => {
    expect(
      verifiedPrimaryEmail({
        primaryEmailAddressId: "idn_primary",
        emailAddresses: [other],
      }),
    ).toBeNull();
  });

  it("refuses an unverified primary address", () => {
    expect(
      verifiedPrimaryEmail({
        primaryEmailAddressId: "idn_primary",
        emailAddresses: [{ ...primary, verification: { status: "unverified" } }],
      }),
    ).toBeNull();
  });

  it("refuses a primary address with no verification record at all", () => {
    expect(
      verifiedPrimaryEmail({
        primaryEmailAddressId: "idn_primary",
        emailAddresses: [{ ...primary, verification: null }],
      }),
    ).toBeNull();
  });

  it("refuses when there is no primary address", () => {
    expect(
      verifiedPrimaryEmail({ primaryEmailAddressId: null, emailAddresses: [primary] }),
    ).toBeNull();
  });
});

const PROGRAMS = [
  "Computer Science",
  "Information Technology",
  "Information System",
  "ACT",
];

describe("isSchoolEmail", () => {
  it("accepts a school address", () => {
    expect(isSchoolEmail("student@gbox.ncf.edu.ph")).toBe(true);
  });

  it("accepts regardless of case or surrounding whitespace", () => {
    expect(isSchoolEmail("  Student@GBOX.NCF.edu.PH ")).toBe(true);
  });

  it("rejects a personal address", () => {
    expect(isSchoolEmail("student@gmail.com")).toBe(false);
  });

  it("rejects a lookalike domain that merely contains the school domain", () => {
    expect(isSchoolEmail("student@gbox.ncf.edu.ph.evil.com")).toBe(false);
  });

  it("rejects an address that only starts with the domain-shaped text", () => {
    expect(isSchoolEmail("gbox.ncf.edu.ph@gmail.com")).toBe(false);
  });

  it("rejects an empty address", () => {
    expect(isSchoolEmail("")).toBe(false);
  });
});

describe("validateOnboarding", () => {
  const valid = {
    email: "student@gbox.ncf.edu.ph",
    name: "Juan Dela Cruz",
    program: "Computer Science",
    studentId: "2021-00123",
  };

  it("accepts a well-formed onboarding", () => {
    expect(validateOnboarding(valid, PROGRAMS)).toEqual([]);
  });

  it("rejects an email outside the school domain", () => {
    const errors = validateOnboarding({ ...valid, email: "student@gmail.com" }, PROGRAMS);
    expect(errors).toEqual([
      { field: "email", message: "Email must be a @gbox.ncf.edu.ph address" },
    ]);
  });

  it("rejects a program outside the Governor-managed list", () => {
    const errors = validateOnboarding({ ...valid, program: "Nursing" }, PROGRAMS);
    expect(errors).toEqual([{ field: "program", message: "Select a valid Program" }]);
  });

  it("accepts a program the Governor added, even if not one of the original 4", () => {
    expect(validateOnboarding({ ...valid, program: "Nursing" }, ["Nursing"])).toEqual([]);
  });

  it("rejects a blank student id", () => {
    const errors = validateOnboarding({ ...valid, studentId: "  " }, PROGRAMS);
    expect(errors).toEqual([{ field: "studentId", message: "Student ID is required" }]);
  });

  it("rejects a blank name", () => {
    const errors = validateOnboarding({ ...valid, name: "  " }, PROGRAMS);
    expect(errors).toEqual([{ field: "name", message: "Name is required" }]);
  });

  it("collects multiple field errors at once", () => {
    const errors = validateOnboarding(
      { email: "bad", name: "", program: "Nursing", studentId: "" },
      PROGRAMS,
    );
    expect(errors.map((e) => e.field).sort()).toEqual([
      "email",
      "name",
      "program",
      "studentId",
    ]);
  });
});
