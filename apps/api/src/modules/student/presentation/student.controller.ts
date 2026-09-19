import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Inject,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import type { CorrectStudentRequest, IdentityResponse } from "@attendance/contracts";
import { AuthGuard } from "../../../shared/presentation/auth.guard";
import { CapabilityGuard } from "../../../shared/presentation/capability.guard";
import { RequireCapability } from "../../../shared/presentation/capability.decorator";
import { CallerActor } from "../../../shared/presentation/actor.decorator";
import type { Actor } from "../../../shared/domain/actor";
import { GetCallerIdentityUseCase } from "../application/get-caller-identity.use-case";
import { CorrectStudentUseCase } from "../application/correct-student.use-case";
import {
  DuplicateStudentIdError,
  InvalidProgramError,
  InvalidStudentIdError,
  StudentNotFoundError,
} from "../domain/student-errors";
import { presentIdentity } from "./identity.presenter";

// Single-action controllers, one-to-one with their use case (ADR-0017).
@Controller("student")
@UseGuards(AuthGuard, CapabilityGuard)
export class StudentController {
  constructor(
    @Inject(GetCallerIdentityUseCase)
    private readonly getCallerIdentity: GetCallerIdentityUseCase,
    @Inject(CorrectStudentUseCase)
    private readonly correctStudent: CorrectStudentUseCase,
  ) {}

  // Every role holding view_own_attendance — student, officer, governor —
  // can reach it; the guard proves the mechanism, not a role split.
  @Post("identity")
  @RequireCapability("view_own_attendance")
  async identity(@CallerActor() caller: Actor): Promise<IdentityResponse> {
    const actor = await this.getCallerIdentity.execute(caller.authUserId);
    return presentIdentity(actor!);
  }

  // ADR-0014: any Officer or Governor may correct any Student's Student ID
  // and Program directly. A Student actor never reaches the use case — the
  // capability guard above refuses them as forbidden.
  @Post("correct/:id")
  @RequireCapability("manage_operations")
  async correct(
    @Param("id") id: string,
    @Body() body: CorrectStudentRequest,
  ): Promise<IdentityResponse> {
    try {
      const actor = await this.correctStudent.execute(id, body);
      return presentIdentity(actor);
    } catch (error) {
      // field threaded through the response body so the web module's
      // correction form can blame the right input (ADR-0014's field-level
      // error UX, preserved across the API boundary).
      if (error instanceof DuplicateStudentIdError) {
        throw new ConflictException({ message: error.message, field: "studentId" });
      }
      if (error instanceof InvalidProgramError) {
        throw new BadRequestException({ message: error.message, field: "program" });
      }
      if (error instanceof InvalidStudentIdError) {
        throw new BadRequestException({ message: error.message, field: "studentId" });
      }
      if (error instanceof StudentNotFoundError) throw new NotFoundException(error.message);
      throw error;
    }
  }
}
