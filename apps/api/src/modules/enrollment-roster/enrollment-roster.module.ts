import { Module } from "@nestjs/common";
import { TOKEN_VERIFIER } from "../../shared/domain/token-verifier";
import { ClerkTokenVerifier } from "../../shared/infrastructure/identity-token-verifier";
import { TokenAuthGuard } from "../../shared/presentation/token-auth.guard";
import { STUDENT_REPOSITORY } from "../student/domain/student-repository";
import { DrizzleStudentRepository } from "../student/infrastructure/drizzle-student.repository";
import { ENROLLMENT_ROSTER_REPOSITORY } from "./domain/enrollment-roster-repository";
import { DrizzleEnrollmentRosterRepository } from "./infrastructure/drizzle-enrollment-roster.repository";
import { IDENTITY_PROFILE_PROVIDER } from "./domain/identity-profile-provider";
import { ClerkIdentityProfileProvider } from "./infrastructure/clerk-identity-profile.provider";
import { ClaimRosterUseCase } from "./application/claim-roster.use-case";
import { EnrollmentRosterController } from "./presentation/enrollment-roster.controller";

// Split by comma, same shape as web's GOVERNOR_EMAILS/ONBOARDING_TEST_EMAILS.
const splitEnvList = (value: string | undefined) =>
  (value ?? "").split(",").map((s) => s.trim()).filter(Boolean);

@Module({
  controllers: [EnrollmentRosterController],
  providers: [
    { provide: TOKEN_VERIFIER, useClass: ClerkTokenVerifier },
    { provide: STUDENT_REPOSITORY, useClass: DrizzleStudentRepository },
    { provide: ENROLLMENT_ROSTER_REPOSITORY, useClass: DrizzleEnrollmentRosterRepository },
    { provide: IDENTITY_PROFILE_PROVIDER, useClass: ClerkIdentityProfileProvider },
    { provide: "GOVERNOR_EMAILS", useValue: splitEnvList(process.env.GOVERNOR_EMAILS) },
    {
      provide: "ONBOARDING_TEST_EMAILS",
      useValue: splitEnvList(process.env.ONBOARDING_TEST_EMAILS),
    },
    ClaimRosterUseCase,
    TokenAuthGuard,
  ],
})
export class EnrollmentRosterModule {}
