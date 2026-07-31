import { describe, expect, it } from "vitest";
import { dashboardDestination, determineRole, ROLE_DESTINATIONS } from "./roles";

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

describe("role destinations", () => {
  it("separates Student attendance from staff operations", () => {
    expect(dashboardDestination("student")).toBe("/my-attendance");
    expect(dashboardDestination("officer")).toBe("/dashboard");
    expect(dashboardDestination("governor")).toBe("/dashboard");
  });

  it("shows staff navigation by role", () => {
    expect(ROLE_DESTINATIONS.student).toEqual(["/my-attendance"]);
    expect(ROLE_DESTINATIONS.officer).toEqual([
      "/dashboard",
      "/events",
      "/my-attendance",
      "/clearance",
    ]);
    expect(ROLE_DESTINATIONS.governor).toEqual([
      ...ROLE_DESTINATIONS.officer,
      "/admin",
    ]);
  });
});
