import { Module } from "@nestjs/common";
import { TOKEN_VERIFIER } from "../../shared/domain/token-verifier";
import { ClerkTokenVerifier } from "../../shared/infrastructure/identity-token-verifier";
import { AuthGuard } from "../../shared/presentation/auth.guard";
import { CapabilityGuard } from "../../shared/presentation/capability.guard";
import { STUDENT_REPOSITORY } from "../student/domain/student-repository";
import { DrizzleStudentRepository } from "../student/infrastructure/drizzle-student.repository";
import { ScanApprovalUseCase } from "./application/scan-approval.use-case";
import { DrizzleScanRepository } from "./infrastructure/drizzle-scan.repository";
import { ScanController } from "./presentation/scan.controller";

@Module({
  controllers: [ScanController],
  providers: [
    { provide: TOKEN_VERIFIER, useClass: ClerkTokenVerifier },
    { provide: STUDENT_REPOSITORY, useClass: DrizzleStudentRepository },
    ScanApprovalUseCase,
    DrizzleScanRepository,
    AuthGuard,
    CapabilityGuard,
  ],
})
export class ScanModule {}
