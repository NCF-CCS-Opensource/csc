import "reflect-metadata";
import { createDb, enrollmentRoster, students, type Database } from "@attendance/db";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClaimRosterUseCase } from "../src/modules/enrollment-roster/application/claim-roster.use-case";
import { DrizzleEnrollmentRosterRepository } from "../src/modules/enrollment-roster/infrastructure/drizzle-enrollment-roster.repository";
import { DrizzleStudentRepository } from "../src/modules/student/infrastructure/drizzle-student.repository";
import { RosterClaimError } from "../src/modules/enrollment-roster/domain/roster-claim-error";
import type { IdentityProfileProvider } from "../src/modules/enrollment-roster/domain/identity-profile-provider";

// Seam 1 (parent issue #157): the ClaimRosterUseCase invoked directly
// against a disposable Postgres. IDENTITY_PROFILE_PROVIDER is the one
// legitimate stub here — it wraps the Clerk SDK, which this seam
// deliberately doesn't reach (ADR-0019, #162).
const db: Database = createDb(process.env.DATABASE_URL!);
const studentRepository = new DrizzleStudentRepository(db);
const rosterRepository = new DrizzleEnrollmentRosterRepository(db);

function useCaseWithProfile(profile: { email: string; name: string } | null) {
  const profiles: IdentityProfileProvider = {
    getVerifiedProfile: vi.fn().mockResolvedValue(profile),
  };
  return new ClaimRosterUseCase(studentRepository, rosterRepository, profiles, [], []);
}

beforeEach(async () => {
  await db.delete(students);
  await db.delete(enrollmentRoster);
  await db.insert(enrollmentRoster).values({
    email: "grace@gbox.ncf.edu.ph",
    firstName: "Grace",
    lastName: "Hopper",
    program: "Computer Science",
    section: "3A",
    studentId: "24-001",
  });
});

describe("Roster Claim", () => {
  it("claims by an exact school email", async () => {
    const useCase = useCaseWithProfile({ email: "grace@gbox.ncf.edu.ph", name: "Grace Hopper" });

    const actor = await useCase.execute("user_grace");

    expect(actor).toMatchObject({ studentId: "24-001", authUserId: "user_grace" });
  });

  it("claims by Student ID plus a matching first/last name", async () => {
    const useCase = useCaseWithProfile({
      email: "unlisted@gbox.ncf.edu.ph",
      name: "Grace Hopper",
    });

    const actor = await useCase.execute("user_grace", "24-001");

    expect(actor).toMatchObject({ studentId: "24-001", authUserId: "user_grace" });
  });

  it("refuses a claim that matches no roster entry, leaving the caller Pending", async () => {
    const useCase = useCaseWithProfile({
      email: "unlisted@gbox.ncf.edu.ph",
      name: "Wrong Name",
    });

    await expect(useCase.execute("user_grace", "24-001")).rejects.toBeInstanceOf(
      RosterClaimError,
    );
    expect(await studentRepository.findByAuthUserId("user_grace")).toBeNull();
  });

  it("is idempotent for an already-claimed Student", async () => {
    const useCase = useCaseWithProfile({ email: "grace@gbox.ncf.edu.ph", name: "Grace Hopper" });
    const first = await useCase.execute("user_grace");

    const second = await useCase.execute("user_grace");

    expect(second).toEqual(first);
  });
});
