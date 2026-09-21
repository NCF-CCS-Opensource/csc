import { Module } from "@nestjs/common";
import { TOKEN_VERIFIER } from "../../shared/domain/token-verifier";
import { ClerkTokenVerifier } from "../../shared/infrastructure/identity-token-verifier";
import { STUDENT_REPOSITORY } from "../student/domain/student-repository";
import { DrizzleStudentRepository } from "../student/infrastructure/drizzle-student.repository";
import { AuthGuard } from "../../shared/presentation/auth.guard";
import { CapabilityGuard } from "../../shared/presentation/capability.guard";
import { PROGRAM_REPOSITORY } from "./domain/program-repository";
import { DrizzleProgramRepository } from "./infrastructure/drizzle-program.repository";
import {
  CreateProgramUseCase,
  DeleteProgramUseCase,
  ListProgramsDetailedUseCase,
  ListProgramsUseCase,
} from "./application/program.use-cases";
import { ProgramController } from "./presentation/program.controller";

@Module({
  controllers: [ProgramController],
  providers: [
    { provide: TOKEN_VERIFIER, useClass: ClerkTokenVerifier },
    { provide: STUDENT_REPOSITORY, useClass: DrizzleStudentRepository },
    { provide: PROGRAM_REPOSITORY, useClass: DrizzleProgramRepository },
    ListProgramsUseCase,
    ListProgramsDetailedUseCase,
    CreateProgramUseCase,
    DeleteProgramUseCase,
    AuthGuard,
    CapabilityGuard,
  ],
  // StudentModule needs PROGRAM_REPOSITORY to validate a correction's Program.
  exports: [PROGRAM_REPOSITORY],
})
export class ProgramModule {}
