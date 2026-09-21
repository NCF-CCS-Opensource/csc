import { Module } from "@nestjs/common";
import { TOKEN_VERIFIER } from "../../shared/domain/token-verifier";
import { ClerkTokenVerifier } from "../../shared/infrastructure/identity-token-verifier";
import { AuthGuard } from "../../shared/presentation/auth.guard";
import { CapabilityGuard } from "../../shared/presentation/capability.guard";
import { STUDENT_REPOSITORY } from "../student/domain/student-repository";
import { DrizzleStudentRepository } from "../student/infrastructure/drizzle-student.repository";
import { LEDGER_REPOSITORY } from "./domain/ledger-repository";
import { DrizzleLedgerRepository } from "./infrastructure/drizzle-ledger.repository";
import { LedgerUseCase } from "./application/ledger.use-case";
import { LedgerController } from "./presentation/ledger.controller";
@Module({
  controllers: [LedgerController],
  providers: [
    { provide: TOKEN_VERIFIER, useClass: ClerkTokenVerifier },
    { provide: STUDENT_REPOSITORY, useClass: DrizzleStudentRepository },
    { provide: LEDGER_REPOSITORY, useClass: DrizzleLedgerRepository },
    LedgerUseCase,
    AuthGuard,
    CapabilityGuard,
  ],
})
export class LedgerModule {}
