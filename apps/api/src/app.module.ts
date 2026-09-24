import { Module } from "@nestjs/common";
import { ThrottlerModule } from "@nestjs/throttler";
import { DbModule } from "./shared/infrastructure/db.module";
import { StudentModule } from "./modules/student/student.module";
import { SemesterModule } from "./modules/semester/semester.module";
import { EventModule } from "./modules/event/event.module";
import { EnrollmentRosterModule } from "./modules/enrollment-roster/enrollment-roster.module";
import { ProgramModule } from "./modules/program/program.module";
import { ScanModule } from "./modules/scan/scan.module";
import { AttendanceModule } from "./modules/attendance/attendance.module";
import { LedgerModule } from "./modules/ledger/ledger.module";
import { ReportModule } from "./modules/report/report.module";

@Module({
  imports: [
    // M-3: registered globally (@Global — see @nestjs/throttler) so any
    // module can attach ThrottlerGuard, but NOT wired as an APP_GUARD. Only
    // ReportController (Gemini/PDF cost) and EnrollmentRosterController
    // (roster-claim brute force) opt in via @UseGuards. Scan routes and
    // everything else stay unlimited to protect the offline booth queue's
    // burst-sync traffic.
    ThrottlerModule.forRoot([{ name: "default", ttl: 60_000, limit: 30 }]),
    DbModule,
    StudentModule,
    SemesterModule,
    EventModule,
    EnrollmentRosterModule,
    ProgramModule,
    ScanModule,
    AttendanceModule,
    LedgerModule,
    ReportModule,
  ],
})
export class AppModule {}
