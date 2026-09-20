import { Module } from "@nestjs/common";
import { AuthGuard } from "../../shared/presentation/auth.guard";
import { CapabilityGuard } from "../../shared/presentation/capability.guard";
import { REPORT_REPOSITORY } from "./domain/report-repository";
import { DrizzleReportRepository } from "./infrastructure/drizzle-report.repository";
import { ReportUseCase } from "./application/report.use-case";
import { ReportController } from "./presentation/report.controller";

@Module({
  controllers: [ReportController],
  providers: [
    { provide: REPORT_REPOSITORY, useClass: DrizzleReportRepository },
    ReportUseCase,
    AuthGuard,
    CapabilityGuard,
  ],
})
export class ReportModule {}
