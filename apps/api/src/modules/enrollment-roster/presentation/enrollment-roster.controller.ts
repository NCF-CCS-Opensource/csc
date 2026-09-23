import {
  BadRequestException,
  Body,
  Controller,
  Inject,
  NotFoundException,
  Post,
  UseGuards,
} from "@nestjs/common";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import type { ClaimRosterRequest, IdentityResponse } from "@attendance/contracts";
import { TokenAuthGuard } from "../../../shared/presentation/token-auth.guard";
import { CallerAuthUserId } from "../../../shared/presentation/caller-auth-user-id.decorator";
import { ClaimRosterUseCase } from "../application/claim-roster.use-case";
import { RosterClaimError } from "../domain/roster-claim-error";
import { presentIdentity } from "../../student/presentation/identity.presenter";

// Single-action controller, one-to-one with ClaimRosterUseCase (ADR-0017).
// TokenAuthGuard only — no capability check, since the caller reaching for
// this route may still be Pending (no capability at all).
// M-3/M-1: this is the roster-claim brute-force route (guessing Student IDs
// against a renamed profile), so it gets a tighter per-IP limit than the
// module default.
@Controller("enrollment-roster")
@UseGuards(TokenAuthGuard, ThrottlerGuard)
@Throttle({ default: { limit: 5, ttl: 60_000 } })
export class EnrollmentRosterController {
  constructor(@Inject(ClaimRosterUseCase) private readonly claimRoster: ClaimRosterUseCase) {}

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
