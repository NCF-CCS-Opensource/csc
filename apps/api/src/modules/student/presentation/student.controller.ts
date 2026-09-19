import { Controller, Inject, Post, UseGuards } from "@nestjs/common";
import type { IdentityResponse } from "@attendance/contracts";
import { AuthGuard } from "../../../shared/presentation/auth.guard";
import { CapabilityGuard } from "../../../shared/presentation/capability.guard";
import { RequireCapability } from "../../../shared/presentation/capability.decorator";
import { CallerActor } from "../../../shared/presentation/actor.decorator";
import type { Actor } from "../../../shared/domain/actor";
import { GetCallerIdentityUseCase } from "../application/get-caller-identity.use-case";
import { presentIdentity } from "./identity.presenter";

// Single-action controller, one-to-one with GetCallerIdentityUseCase
// (ADR-0017). Every role holding view_own_attendance — student, officer,
// governor — can reach it; the guard proves the mechanism, not a role split.
@Controller("student")
@UseGuards(AuthGuard, CapabilityGuard)
export class StudentController {
  constructor(
    @Inject(GetCallerIdentityUseCase)
    private readonly getCallerIdentity: GetCallerIdentityUseCase,
  ) {}

  @Post("identity")
  @RequireCapability("view_own_attendance")
  async identity(@CallerActor() caller: Actor): Promise<IdentityResponse> {
    const actor = await this.getCallerIdentity.execute(caller.authUserId);
    return presentIdentity(actor!);
  }
}
