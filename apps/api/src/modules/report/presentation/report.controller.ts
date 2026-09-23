import { Body, Controller, HttpException, Inject, Post, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { AuthGuard } from "../../../shared/presentation/auth.guard";
import { CapabilityGuard } from "../../../shared/presentation/capability.guard";
import { RequireCapability } from "../../../shared/presentation/capability.decorator";
import { IdentityThrottlerGuard } from "../../../shared/presentation/identity-throttler.guard";
import { ReportUseCase } from "../application/report.use-case";

// All four Report types are Officer/Governor-only, same capability as the
// Ledger's semester/student actions (spec #168).
// M-3: each call renders a PDF and, on the web BFF side, calls Gemini — real
// per-request cost — so throttle it tighter than the module default. Keyed
// by IdentityThrottlerGuard on the caller's actor id, not IP (validation
// finding: every request arrives from apps/web's BFF, so an IP-keyed limit
// would be shared by every Officer at once, effectively 10/min for the
// whole staff instead of per-Officer). Note this is 10/min PER ROUTE, so an
// Officer generating all four report types can still make ~40 calls/min —
// accepted for now, tightening to a shared cross-route bucket is a
// follow-up if that proves too loose in practice.
@Controller("report")
@UseGuards(AuthGuard, CapabilityGuard, IdentityThrottlerGuard)
@Throttle({ default: { limit: 10, ttl: 60_000 } })
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
