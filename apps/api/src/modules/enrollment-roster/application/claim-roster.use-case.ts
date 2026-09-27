import { Inject, Injectable } from "@nestjs/common";
import {
  ENROLLMENT_ROSTER_REPOSITORY,
  type EnrollmentRosterRepository,
  type RosterRow,
} from "../domain/enrollment-roster-repository";
import {
  IDENTITY_PROFILE_PROVIDER,
  type IdentityProfileProvider,
} from "../domain/identity-profile-provider";
import { determineRole, isSchoolEmail, rosterNameMatches } from "../domain/roster-rules";
import { RosterClaimError } from "../domain/roster-claim-error";
import { STUDENT_REPOSITORY, type StudentRepository } from "../../student/domain/student-repository";
import type { Actor } from "../../../shared/domain/actor";

// Ported from apps/web/lib/enrollment-roster.ts, onboarding/actions.ts and
// onboarding/page.tsx (ADR-0019). A Pending Student claims their Enrollment
// Roster entry: an exact school email claims directly, otherwise the
// supplied Student ID plus a first/last-name match is required.
@Injectable()
export class ClaimRosterUseCase {
  constructor(
    @Inject(STUDENT_REPOSITORY) private readonly students: StudentRepository,
    @Inject(ENROLLMENT_ROSTER_REPOSITORY) private readonly roster: EnrollmentRosterRepository,
    @Inject(IDENTITY_PROFILE_PROVIDER) private readonly profiles: IdentityProfileProvider,
    @Inject("GOVERNOR_EMAILS") private readonly governorEmails: string[],
    @Inject("ONBOARDING_TEST_EMAILS") private readonly testEmails: string[],
  ) {}

  async execute(authUserId: string, studentIdInput?: string): Promise<Actor> {
    // Already a Student — a resubmitted claim must not look like a refusal.
    const existing = await this.students.findByAuthUserId(authUserId);
    if (existing) return existing;

    const profile = await this.profiles.getVerifiedProfile(authUserId);
    if (!profile) {
      throw new RosterClaimError(
        "no-verified-email",
        "Your Google account has no verified email address.",
      );
    }
    if (!isSchoolEmail(profile.email, this.testEmails)) {
      throw new RosterClaimError(
        "not-school-email",
        "Email must be a @gbox.ncf.edu.ph address",
      );
    }

    const byEmail = await this.roster.findByEmail(profile.email.toLowerCase());
    if (byEmail) return this.createStudent(authUserId, profile.email, profile.name, byEmail);

    if (!studentIdInput?.trim()) {
      throw new RosterClaimError("no-student-id", "Student ID is required");
    }

    const byStudentId = await this.roster.findByStudentId(studentIdInput.trim());
    // M-1: a Student ID is printed on the owner's QR Card and the profile
    // name is user-editable, so together they don't prove identity. A row
    // with a roster email belongs to that address alone (the email path
    // above claims it); refuse an ID claim from any other email, with the
    // same uniform no-match so this isn't an oracle.
    const ownedByOtherEmail =
      byStudentId?.email != null &&
      byStudentId.email.toLowerCase() !== profile.email.toLowerCase();
    if (!byStudentId || ownedByOtherEmail || !rosterNameMatches(profile.name, byStudentId)) {
      throw new RosterClaimError(
        "no-match",
        "That Student ID could not be matched to your Google profile. Contact an Officer.",
      );
    }
    return this.createStudent(authUserId, profile.email, profile.name, byStudentId);
  }

  private createStudent(authUserId: string, email: string, name: string, roster: RosterRow) {
    return this.students.create({
      authUserId,
      email,
      name: [roster.firstName, roster.middleName, roster.lastName].filter(Boolean).join(" "),
      program: roster.program,
      section: roster.section,
      studentId: roster.studentId,
      role: determineRole(email, this.governorEmails),
    });
  }
}
