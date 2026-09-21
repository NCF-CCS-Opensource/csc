import { Inject, Injectable } from "@nestjs/common";
import type { Program } from "@attendance/contracts";
import { PROGRAM_REPOSITORY, type ProgramRepository } from "../domain/program-repository";

// Governor-managed Program list (ADR-0014, ADR-0019). Ported from
// apps/web/app/(app)/admin/actions.ts and students/actions.ts.
@Injectable()
export class ListProgramsUseCase {
  constructor(@Inject(PROGRAM_REPOSITORY) private readonly programs: ProgramRepository) {}

  execute(): Promise<string[]> {
    return this.programs.listNames();
  }
}

// Closes Known Gap #5 (PR #184): listNames() drops the id the
// remove-Program form on admin/page.tsx needs; this keeps it.
@Injectable()
export class ListProgramsDetailedUseCase {
  constructor(@Inject(PROGRAM_REPOSITORY) private readonly programs: ProgramRepository) {}

  execute(): Promise<Program[]> {
    return this.programs.listAll();
  }
}

@Injectable()
export class CreateProgramUseCase {
  constructor(@Inject(PROGRAM_REPOSITORY) private readonly programs: ProgramRepository) {}

  execute(name: string): Promise<Program> {
    return this.programs.create(name.trim());
  }
}

@Injectable()
export class DeleteProgramUseCase {
  constructor(@Inject(PROGRAM_REPOSITORY) private readonly programs: ProgramRepository) {}

  execute(id: string): Promise<void> {
    return this.programs.delete(id);
  }
}
