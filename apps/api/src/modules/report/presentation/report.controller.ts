import { Body, Controller, HttpException, Inject, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../../../shared/presentation/auth.guard";
import { CapabilityGuard } from "../../../shared/presentation/capability.guard";
import { RequireCapability } from "../../../shared/presentation/capability.decorator";
import { ReportUseCase } from "../application/report.use-case";

// All four Report types are Officer/Governor-only, same capability as the
// Ledger's semester/student actions (spec #168).
@Controller("report")
@UseGuards(AuthGuard, CapabilityGuard)
export class ReportController {
  constructor(@Inject(ReportUseCase) private readonly report: ReportUseCase) {}

  @Post("per-event")
  @RequireCapability("manage_operations")
  perEvent(@Body() body: { eventId?: string }) {
    if (!body.eventId) throw new HttpException("Invalid request", 400);
    return this.report.perEvent(body.eventId);
  }

  @Post("per-student")
  @RequireCapability("manage_operations")
  perStudent(@Body() body: { studentId?: string; semesterId?: string }) {
    if (!body.studentId || !body.semesterId) throw new HttpException("Invalid request", 400);
    return this.report.perStudent(body.studentId, body.semesterId);
  }

  @Post("per-semester")
  @RequireCapability("manage_operations")
  perSemester(@Body() body: { semesterId?: string }) {
    if (!body.semesterId) throw new HttpException("Invalid request", 400);
    return this.report.perSemester(body.semesterId);
  }

  @Post("financial")
  @RequireCapability("manage_operations")
  financial(@Body() body: { semesterId?: string }) {
    if (!body.semesterId) throw new HttpException("Invalid request", 400);
    return this.report.financial(body.semesterId);
  }
}
