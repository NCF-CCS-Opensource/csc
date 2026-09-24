import { Body, Controller, HttpException, Inject, Post, UseGuards } from "@nestjs/common";
import type { CorrectAttendanceRequest, RecordPaymentsRequest, RecordSafFeePaymentRequest, VoidPaymentRequest } from "@attendance/contracts";
import type { Actor } from "../../../shared/domain/actor";
import { CallerActor } from "../../../shared/presentation/actor.decorator";
import { AuthGuard } from "../../../shared/presentation/auth.guard";
import { RequireCapability } from "../../../shared/presentation/capability.decorator";
import { CapabilityGuard } from "../../../shared/presentation/capability.guard";
import { AttendanceUseCase } from "../application/attendance.use-case";

@Controller("attendance")
@UseGuards(AuthGuard, CapabilityGuard)
export class AttendanceController {
  constructor(@Inject(AttendanceUseCase) private readonly attendance: AttendanceUseCase) {}

  @Post("grid")
  @RequireCapability("manage_operations")
  async grid(@Body() body: { eventId?: string }) {
    if (!body.eventId) throw new HttpException("Invalid request", 400);
    return this.attendance.grid(body.eventId);
  }

  @Post("materialize-no-shows")
  @RequireCapability("manage_operations")
  async materializeNoShows(@Body() body: { eventId?: string }) {
    if (!body.eventId) throw new HttpException("Invalid request", 400);
    await this.attendance.materializeNoShows(body.eventId);
    return { ok: true };
  }

  @Post("correct")
  @RequireCapability("manage_operations")
  async correct(@CallerActor() actor: Actor, @Body() body: CorrectAttendanceRequest) {
    if (!body?.sessionId || !["timeIn", "timeOut"].includes(body.field) || typeof body.present !== "boolean") {
      throw new HttpException("Invalid request", 400);
    }
    return this.attendance.correct(body, actor.id);
  }

  @Post("payments")
  @RequireCapability("manage_operations")
  async payments(@CallerActor() actor: Actor, @Body() body: RecordPaymentsRequest) {
    if (!Array.isArray(body?.penaltyIds) || !body.penaltyIds.every((id) => typeof id === "string")) {
      throw new HttpException("Invalid request", 400);
    }
    await this.attendance.recordPayments(body.penaltyIds, actor.id);
    return { ok: true };
  }

  // 409 when an un-voided SAF Fee Payment already exists; 400 when the
  // Semester has no SAF Fee amount (ADR 0024).
  @Post("payments/saf")
  @RequireCapability("manage_operations")
  async safFeePayment(@CallerActor() actor: Actor, @Body() body: RecordSafFeePaymentRequest) {
    if (typeof body?.studentId !== "string" || typeof body.semesterId !== "string") throw new HttpException("Invalid request", 400);
    await this.attendance.recordSafFeePayment(body.studentId, body.semesterId, actor.id);
    return { ok: true };
  }

  // Works in open and closed Semesters alike, like recording a Payment.
  @Post("payments/void")
  @RequireCapability("manage_operations")
  async voidPayment(@CallerActor() actor: Actor, @Body() body: VoidPaymentRequest) {
    if (typeof body?.paymentId !== "string") throw new HttpException("Invalid request", 400);
    await this.attendance.voidPayment(body.paymentId, actor.id);
    return { ok: true };
  }
}
