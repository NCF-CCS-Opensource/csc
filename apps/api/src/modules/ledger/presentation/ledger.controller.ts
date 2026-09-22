import { Body, Controller, HttpException, Inject, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../../../shared/presentation/auth.guard";
import { CapabilityGuard } from "../../../shared/presentation/capability.guard";
import { RequireCapability } from "../../../shared/presentation/capability.decorator";
import { CallerActor } from "../../../shared/presentation/actor.decorator";
import type { Actor } from "../../../shared/domain/actor";
import { LedgerUseCase } from "../application/ledger.use-case";

@Controller("ledger")
@UseGuards(AuthGuard, CapabilityGuard)
export class LedgerController {
  constructor(@Inject(LedgerUseCase) private readonly ledger: LedgerUseCase) {}
  @Post("mine")
  @RequireCapability("view_own_attendance")
  mine(@CallerActor() actor: Actor, @Body() body: { semesterId?: string }) {
    if (!body.semesterId) {
      throw new HttpException("Invalid request", 400);
    }
    return this.ledger.student(body.semesterId, actor.id);
  }
  @Post("mine/history")
  @RequireCapability("view_own_attendance")
  mineHistory(@CallerActor() actor: Actor) {
    return this.ledger.paymentHistory(actor.id);
  }
  @Post("student")
  @RequireCapability("manage_operations")
  student(@Body() body: { semesterId?: string; studentId?: string }) {
    if (!body.semesterId || !body.studentId) {
      throw new HttpException("Invalid request", 400);
    }
    return this.ledger.student(body.semesterId, body.studentId);
  }
  @Post("semester")
  @RequireCapability("manage_operations")
  semester(@Body() body: { semesterId?: string }) {
    if (!body.semesterId) {
      throw new HttpException("Invalid request", 400);
    }
    return this.ledger.semester(body.semesterId);
  }
  @Post("semester/outstanding")
  @RequireCapability("manage_operations")
  semesterOutstanding(@Body() body: { semesterId?: string }) {
    if (!body.semesterId) {
      throw new HttpException("Invalid request", 400);
    }
    return this.ledger.semesterOutstanding(body.semesterId);
  }
}
