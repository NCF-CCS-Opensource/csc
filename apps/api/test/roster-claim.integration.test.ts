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
  // No GBox address in the spreadsheet: only Student ID + name can claim it.
  await db.insert(enrollmentRoster).values({
    email: null,
    firstName: "Ada",
    lastName: "Lovelace",
    program: "Computer Science",
    section: "3A",
    studentId: "24-002",
  });
});

describe("Roster Claim", () => {
  it("claims by an exact school email", async () => {
    const useCase = useCaseWithProfile({ email: "grace@gbox.ncf.edu.ph", name: "Grace Hopper" });

    const actor = await useCase.execute("user_grace");

    expect(actor).toMatchObject({ studentId: "24-001", authUserId: "user_grace" });
  });

  it("claims a roster row with no email by Student ID plus a matching first/last name", async () => {
    const useCase = useCaseWithProfile({
      email: "ada.personal@gbox.ncf.edu.ph",
      name: "Ada Lovelace",
    });

    const actor = await useCase.execute("user_ada", "24-002");

    expect(actor).toMatchObject({ studentId: "24-002", authUserId: "user_ada" });
  });

  // M-1: Student ID is on the victim's QR Card and the profile name is
  // self-editable, so they must not claim a row that has its own email.
  it("refuses a Student ID + renamed-profile claim on a roster row owned by another email", async () => {
    const attacker = useCaseWithProfile({
      email: "attacker@gbox.ncf.edu.ph",
      name: "Grace Hopper",
    });

    await expect(attacker.execute("user_attacker", "24-001")).rejects.toMatchObject({
      reason: "no-match",
    });
    expect(await studentRepository.findByAuthUserId("user_attacker")).toBeNull();

    // The real owner can still claim their row afterwards.
    const owner = useCaseWithProfile({ email: "grace@gbox.ncf.edu.ph", name: "Grace Hopper" });
    await expect(owner.execute("user_grace")).resolves.toMatchObject({ studentId: "24-001" });
  });

  it("refuses to claim an unclaimed roster row by name match alone, without its correct Student ID", async () => {
    const useCase = useCaseWithProfile({
      email: "ada.personal@gbox.ncf.edu.ph",
      name: "Ada Lovelace",
    });

    await expect(useCase.execute("user_ada")).rejects.toMatchObject({ reason: "no-student-id" });
    await expect(useCase.execute("user_ada", "24-999")).rejects.toMatchObject({ reason: "no-match" });
    await expect(useCase.execute("user_ada", "24-001")).rejects.toMatchObject({ reason: "no-match" });
    expect(await studentRepository.findByAuthUserId("user_ada")).toBeNull();
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
