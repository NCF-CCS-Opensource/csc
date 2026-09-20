import { Body, Controller, HttpException, Inject, Post, UseGuards } from "@nestjs/common";
import type { ScanDecisionRequest } from "@attendance/contracts";
import { CallerActor } from "../../../shared/presentation/actor.decorator";
import { AuthGuard } from "../../../shared/presentation/auth.guard";
import { RequireCapability } from "../../../shared/presentation/capability.decorator";
import { CapabilityGuard } from "../../../shared/presentation/capability.guard";
import type { Actor } from "../../../shared/domain/actor";
import { ScanApprovalUseCase } from "../application/scan-approval.use-case";
import { ScanError } from "../domain/scan-error";

@Controller("scan")
@UseGuards(AuthGuard, CapabilityGuard)
export class ScanController {
  constructor(@Inject(ScanApprovalUseCase) private readonly scans: ScanApprovalUseCase) {}

  @Post("identify")
  @RequireCapability("use_mobile_booth")
  async identify(@CallerActor() actor: Actor, @Body() body: { qrPayload?: string }) {
    if (!body.qrPayload) throw new HttpException("Invalid request", 400);
    return this.run(() => this.scans.identify(actor, body.qrPayload!));
  }

  @Post("approve")
  @RequireCapability("use_mobile_booth")
  async approve(@CallerActor() actor: Actor, @Body() body: ScanDecisionRequest) {
    this.validate(body, true);
    return this.run(() => this.scans.approve(actor, body));
  }

  @Post("reject")
  @RequireCapability("use_mobile_booth")
  async reject(@CallerActor() actor: Actor, @Body() body: ScanDecisionRequest) {
    this.validate(body, false);
    return this.run(() => this.scans.reject(actor, body));
  }

  @Post("rejections")
  @RequireCapability("use_mobile_booth")
  async rejections(@CallerActor() actor: Actor) {
    return this.run(() => this.scans.rejections(actor));
  }

  private validate(body: ScanDecisionRequest, needsMode: boolean): void {
    if (!body?.scanId || !body.eventId || !body.qrPayload || !body.scannedAt || (needsMode && !body.mode)) {
      throw new HttpException("Invalid request", 400);
    }
  }

  private async run<T>(action: () => Promise<T>): Promise<T> {
    try {
      return await action();
    } catch (error) {
      if (error instanceof ScanError) throw new HttpException(error.message, error.status);
      throw error;
    }
  }
}
