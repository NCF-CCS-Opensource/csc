import { describe, expect, it } from "vitest";
import {
  capabilityFailure,
  dashboardDestination,
  destinationsForRole,
  determineRole,
  hasCapability,
  type Capability,
  type Role,
} from "./roles";

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
    expect(destinationsForRole("student")).toEqual(["/my-attendance"]);
    expect(destinationsForRole("officer")).toEqual([
      "/dashboard",
      "/events",
      "/my-attendance",
      "/clearance",
      "/students",
      "/analytics",
    ]);
    expect(destinationsForRole("governor")).toEqual([
      "/dashboard",
      "/events",
      "/my-attendance",
      "/clearance",
      "/admin",
      "/students",
      "/analytics",
    ]);
  });
});

describe("capability policy", () => {
  const expected: Record<Role, Record<Capability, boolean>> = {
    student: {
      view_own_attendance: true,
      manage_operations: false,
      administer: false,
      use_mobile_booth: false,
    },
    officer: {
      view_own_attendance: true,
      manage_operations: true,
      administer: false,
      use_mobile_booth: true,
    },
    governor: {
      view_own_attendance: true,
      manage_operations: true,
      administer: true,
      use_mobile_booth: true,
    },
  };

  it("defines every application capability for every role", () => {
    for (const [role, capabilities] of Object.entries(expected) as [
      Role,
      Record<Capability, boolean>,
    ][]) {
      for (const [capability, allowed] of Object.entries(capabilities) as [
        Capability,
        boolean,
      ][]) {
        expect(hasCapability(role, capability)).toBe(allowed);
      }
    }
  });

  it("distinguishes missing identity from forbidden capability", () => {
    expect(capabilityFailure(null, "use_mobile_booth")).toBe("unauthenticated");
    expect(capabilityFailure("student", "use_mobile_booth")).toBe("forbidden");
    expect(capabilityFailure("officer", "use_mobile_booth")).toBeNull();
    expect(capabilityFailure("governor", "use_mobile_booth")).toBeNull();
  });
});
