import { Module } from "@nestjs/common";
import { TOKEN_VERIFIER } from "../../shared/domain/token-verifier";
import { ClerkTokenVerifier } from "../../shared/infrastructure/identity-token-verifier";
import { STUDENT_REPOSITORY } from "./domain/student-repository";
import { DrizzleStudentRepository } from "./infrastructure/drizzle-student.repository";
import { GetCallerIdentityUseCase } from "./application/get-caller-identity.use-case";
import { CorrectStudentUseCase } from "./application/correct-student.use-case";
import { StudentController } from "./presentation/student.controller";
import { AuthGuard } from "../../shared/presentation/auth.guard";
import { CapabilityGuard } from "../../shared/presentation/capability.guard";
import { ProgramModule } from "../program/program.module";

@Module({
  imports: [ProgramModule],
  controllers: [StudentController],
  providers: [
    { provide: TOKEN_VERIFIER, useClass: ClerkTokenVerifier },
    { provide: STUDENT_REPOSITORY, useClass: DrizzleStudentRepository },
    GetCallerIdentityUseCase,
    CorrectStudentUseCase,
    AuthGuard,
    CapabilityGuard,
  ],
})
export class StudentModule {}
