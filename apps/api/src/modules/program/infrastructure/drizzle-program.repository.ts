import { Inject, Injectable } from "@nestjs/common";
import { asc, eq } from "drizzle-orm";
import { programs, type Database } from "@attendance/db";
import type { Program } from "@attendance/contracts";
import { DB } from "../../../shared/infrastructure/db.module";
import {
  DuplicateProgramError,
  ProgramInUseError,
  type ProgramRepository,
} from "../domain/program-repository";

@Injectable()
export class DrizzleProgramRepository implements ProgramRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

  async listNames(): Promise<string[]> {
    const rows = await this.db
      .select({ name: programs.name })
      .from(programs)
      .orderBy(asc(programs.name));
    return rows.map((row) => row.name);
  }

  async listAll(): Promise<Program[]> {
    return this.db.select().from(programs).orderBy(asc(programs.name));
  }

  async create(name: string): Promise<Program> {
    try {
      const [row] = await this.db.insert(programs).values({ name }).returning();
      return row!;
    } catch (error) {
      if ((error as { code?: string }).code === "23505") throw new DuplicateProgramError();
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.db.delete(programs).where(eq(programs.id, id));
    } catch (error) {
      if ((error as { code?: string }).code === "23503") throw new ProgramInUseError();
      throw error;
    }
  }
}
