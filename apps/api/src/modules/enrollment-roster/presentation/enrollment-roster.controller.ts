import {
  BadRequestException,
  Body,
  Controller,
  NotFoundException,
  Post,
  UseGuards,
} from "@nestjs/common";
import type { ClaimRosterRequest, IdentityResponse } from "@attendance/contracts";
import { TokenAuthGuard } from "../../../shared/presentation/token-auth.guard";
import { CallerAuthUserId } from "../../../shared/presentation/caller-auth-user-id.decorator";
import { ClaimRosterUseCase } from "../application/claim-roster.use-case";
import { RosterClaimError } from "../domain/roster-claim-error";
import { presentIdentity } from "../../student/presentation/identity.presenter";

// Single-action controller, one-to-one with ClaimRosterUseCase (ADR-0017).
// TokenAuthGuard only — no capability check, since the caller reaching for
// this route may still be Pending (no capability at all).
@Controller("enrollment-roster")
@UseGuards(TokenAuthGuard)
export class EnrollmentRosterController {
  constructor(private readonly claimRoster: ClaimRosterUseCase) {}

  @Post("claim")
  async claim(
    @CallerAuthUserId() authUserId: string,
    @Body() body: ClaimRosterRequest,
  ): Promise<IdentityResponse> {
    try {
      const actor = await this.claimRoster.execute(authUserId, body.studentId);
      return presentIdentity(actor);
    } catch (error) {
      if (error instanceof RosterClaimError) {
        // field threaded through so the onboarding form can blame the
        // right input, same as StudentController#correct.
        const field = error.reason === "no-student-id" || error.reason === "no-match"
          ? "studentId"
          : "email";
        if (error.reason === "no-match") {
          throw new NotFoundException({ message: error.message, field });
        }
        throw new BadRequestException({ message: error.message, field });
      }
      throw error;
    }
  }
}
