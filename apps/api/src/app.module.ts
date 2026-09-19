import { Module } from "@nestjs/common";
import { DbModule } from "./shared/infrastructure/db.module";
import { StudentModule } from "./modules/student/student.module";
import { SemesterModule } from "./modules/semester/semester.module";
import { EventModule } from "./modules/event/event.module";
import { EnrollmentRosterModule } from "./modules/enrollment-roster/enrollment-roster.module";
import { ProgramModule } from "./modules/program/program.module";
import { ScanModule } from "./modules/scan/scan.module";
import { AttendanceModule } from "./modules/attendance/attendance.module";

@Module({
  imports: [
    DbModule,
    StudentModule,
    SemesterModule,
    EventModule,
    EnrollmentRosterModule,
    ProgramModule,
    ScanModule,
    AttendanceModule,
  ],
})
export class AppModule {}
