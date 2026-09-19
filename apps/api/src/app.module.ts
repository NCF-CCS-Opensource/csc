import { Module } from "@nestjs/common";
import { DbModule } from "./shared/infrastructure/db.module";
import { StudentModule } from "./modules/student/student.module";
import { EnrollmentRosterModule } from "./modules/enrollment-roster/enrollment-roster.module";
import { ProgramModule } from "./modules/program/program.module";

@Module({
  imports: [DbModule, StudentModule, EnrollmentRosterModule, ProgramModule],
})
export class AppModule {}
