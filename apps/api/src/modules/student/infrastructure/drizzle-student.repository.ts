import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { students, type Database } from "@attendance/db";
import { DB } from "../../../shared/infrastructure/db.module";
import type { StudentRepository } from "../domain/student-repository";
import type { Actor } from "../../../shared/domain/actor";
import { toActor } from "./student.mapper";

@Injectable()
export class DrizzleStudentRepository implements StudentRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

  async findByAuthUserId(authUserId: string): Promise<Actor | null> {
    const row = await this.db.query.students.findFirst({
      where: eq(students.authUserId, authUserId),
    });
    return row ? toActor(row) : null;
  }
}
