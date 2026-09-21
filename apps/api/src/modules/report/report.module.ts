import { Module } from "@nestjs/common";
import { TOKEN_VERIFIER } from "../../shared/domain/token-verifier";
import { ClerkTokenVerifier } from "../../shared/infrastructure/identity-token-verifier";
import { AuthGuard } from "../../shared/presentation/auth.guard";
import { CapabilityGuard } from "../../shared/presentation/capability.guard";
import { STUDENT_REPOSITORY } from "../student/domain/student-repository";
import { DrizzleStudentRepository } from "../student/infrastructure/drizzle-student.repository";
import { REPORT_REPOSITORY } from "./domain/report-repository";
import { DrizzleReportRepository } from "./infrastructure/drizzle-report.repository";
import { ReportUseCase } from "./application/report.use-case";
import { ReportController } from "./presentation/report.controller";

@Module({
  controllers: [ReportController],
  providers: [
    { provide: TOKEN_VERIFIER, useClass: ClerkTokenVerifier },
    { provide: STUDENT_REPOSITORY, useClass: DrizzleStudentRepository },
    { provide: REPORT_REPOSITORY, useClass: DrizzleReportRepository },
    ReportUseCase,
    AuthGuard,
    CapabilityGuard,
  ],
})
export class ReportModule {}
