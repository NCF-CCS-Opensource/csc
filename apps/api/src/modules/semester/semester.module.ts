import { Module } from "@nestjs/common";
import { TOKEN_VERIFIER } from "../../shared/domain/token-verifier";
import { ClerkTokenVerifier } from "../../shared/infrastructure/identity-token-verifier";
import { STUDENT_REPOSITORY } from "../student/domain/student-repository";
import { DrizzleStudentRepository } from "../student/infrastructure/drizzle-student.repository";
import { SEMESTER_REPOSITORY } from "./domain/semester-repository";
import { DrizzleSemesterRepository } from "./infrastructure/drizzle-semester.repository";
import { CreateSemesterUseCase } from "./application/create-semester.use-case";
import { UpdateSemesterDatesUseCase } from "./application/update-semester-dates.use-case";
import { CloseSemesterUseCase } from "./application/close-semester.use-case";
import { GetOpenSemesterUseCase } from "./application/get-open-semester.use-case";
import { ListSemestersUseCase } from "./application/list-semesters.use-case";
import { DeleteSemesterUseCase } from "./application/delete-semester.use-case";
import { SemesterController } from "./presentation/semester.controller";
import { AuthGuard } from "../../shared/presentation/auth.guard";
import { CapabilityGuard } from "../../shared/presentation/capability.guard";

@Module({
  controllers: [SemesterController],
  providers: [
    { provide: TOKEN_VERIFIER, useClass: ClerkTokenVerifier },
    { provide: STUDENT_REPOSITORY, useClass: DrizzleStudentRepository },
    { provide: SEMESTER_REPOSITORY, useClass: DrizzleSemesterRepository },
    CreateSemesterUseCase,
    UpdateSemesterDatesUseCase,
    CloseSemesterUseCase,
    GetOpenSemesterUseCase,
    ListSemestersUseCase,
    DeleteSemesterUseCase,
    AuthGuard,
    CapabilityGuard,
  ],
})
export class SemesterModule {}
