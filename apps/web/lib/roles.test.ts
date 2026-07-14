import { describe, expect, it } from "vitest";
import { determineRole } from "./roles";

describe("determineRole", () => {
  it("assigns governor to an allowlisted email", () => {
    expect(
      determineRole("gov@gbox.ncf.edu.ph", ["gov@gbox.ncf.edu.ph"]),
    ).toBe("governor");
  });

  it("is case-insensitive on the allowlist", () => {
    expect(
      determineRole("Gov@Gbox.NCF.edu.ph", ["gov@gbox.ncf.edu.ph"]),
    ).toBe("governor");
  });

  it("defaults everyone else to student", () => {
    expect(
      determineRole("student@gbox.ncf.edu.ph", ["gov@gbox.ncf.edu.ph"]),
    ).toBe("student");
  });

  it("defaults to student when the allowlist is empty", () => {
    expect(determineRole("anyone@gbox.ncf.edu.ph", [])).toBe("student");
  });
});
