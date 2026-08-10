import { describe, expect, it } from "vitest";
import { validateStudentCorrection } from "./students";

describe("validateStudentCorrection", () => {
  const validPrograms = ["Computer Science", "Information Technology"];

  it("accepts a well-formed correction", () => {
    expect(
      validateStudentCorrection(
        { studentId: "24-001", program: "Computer Science" },
        validPrograms,
      ),
    ).toEqual([]);
  });

  it("rejects a blank Student ID", () => {
    expect(
      validateStudentCorrection({ studentId: "  ", program: "Computer Science" }, validPrograms),
    ).toEqual([{ field: "studentId", message: "Student ID is required" }]);
  });

  it("rejects a Program outside the Governor-managed list", () => {
    expect(
      validateStudentCorrection({ studentId: "24-001", program: "Underwater Basketry" }, validPrograms),
    ).toEqual([{ field: "program", message: "Select a valid Program" }]);
  });
});
