import { Module } from "@nestjs/common";
import { DbModule } from "./shared/infrastructure/db.module";
import { StudentModule } from "./modules/student/student.module";

@Module({
  imports: [DbModule, StudentModule],
})
export class AppModule {}
