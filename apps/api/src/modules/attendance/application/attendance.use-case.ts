import { Inject, Injectable } from "@nestjs/common";
import type { AttendanceGridResponse, CorrectAttendanceRequest } from "@attendance/contracts";
import { DrizzleAttendanceRepository } from "../infrastructure/drizzle-attendance.repository";

@Injectable()
export class AttendanceUseCase {
  constructor(@Inject(DrizzleAttendanceRepository) private readonly attendance: DrizzleAttendanceRepository) {}

  grid(eventId: string): Promise<AttendanceGridResponse> {
    return this.attendance.grid(eventId);
  }

  materializeNoShows(eventId: string): Promise<void> {
    return this.attendance.materializeNoShows(eventId);
  }

  correct(input: CorrectAttendanceRequest, actorId: string): Promise<{ eventId: string }> {
    return this.attendance.correct(input, actorId);
  }

  recordPayments(penaltyIds: string[], officerId: string): Promise<void> {
    return this.attendance.recordPayments(penaltyIds, officerId);
  }

  recordSafFeePayment(studentId: string, semesterId: string, officerId: string): Promise<void> {
    return this.attendance.recordSafFeePayment(studentId, semesterId, officerId);
  }

  voidPayment(paymentId: string, officerId: string): Promise<void> {
    return this.attendance.voidPayment(paymentId, officerId);
  }
}
