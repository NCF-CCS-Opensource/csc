import { Module } from "@nestjs/common";
import { DbModule } from "./shared/infrastructure/db.module";
import { StudentModule } from "./modules/student/student.module";
import { SemesterModule } from "./modules/semester/semester.module";
import { EventModule } from "./modules/event/event.module";

@Module({
  imports: [DbModule, StudentModule, SemesterModule, EventModule],
})
export class AppModule {}
