import { Module } from "@nestjs/common";
import { TOKEN_VERIFIER } from "../../shared/domain/token-verifier";
import { ClerkTokenVerifier } from "../../shared/infrastructure/identity-token-verifier";
import { AuthGuard } from "../../shared/presentation/auth.guard";
import { CapabilityGuard } from "../../shared/presentation/capability.guard";
import { STUDENT_REPOSITORY } from "../student/domain/student-repository";
import { DrizzleStudentRepository } from "../student/infrastructure/drizzle-student.repository";
import { AttendanceUseCase } from "./application/attendance.use-case";
import { DrizzleAttendanceRepository } from "./infrastructure/drizzle-attendance.repository";
import { AttendanceController } from "./presentation/attendance.controller";

@Module({
  controllers: [AttendanceController],
  providers: [
    { provide: TOKEN_VERIFIER, useClass: ClerkTokenVerifier },
    { provide: STUDENT_REPOSITORY, useClass: DrizzleStudentRepository },
    AttendanceUseCase,
    DrizzleAttendanceRepository,
    AuthGuard,
    CapabilityGuard,
  ],
})
export class AttendanceModule {}
