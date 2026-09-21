import { Body, ConflictException, Controller, Inject, Post, UseGuards } from "@nestjs/common";
import type {
  CreateProgramRequest,
  DeleteProgramRequest,
  Program,
  ProgramListDetailedResponse,
} from "@attendance/contracts";
import { AuthGuard } from "../../../shared/presentation/auth.guard";
import { CapabilityGuard } from "../../../shared/presentation/capability.guard";
import { RequireCapability } from "../../../shared/presentation/capability.decorator";
import {
  CreateProgramUseCase,
  DeleteProgramUseCase,
  ListProgramsDetailedUseCase,
  ListProgramsUseCase,
} from "../application/program.use-cases";
import { DuplicateProgramError, ProgramInUseError } from "../domain/program-repository";

// Ported from apps/web/app/(app)/admin/actions.ts and students/actions.ts
// (ADR-0014). Listing is available to any Officer or Governor (the Students
// page needs it for the correction dropdown); create/delete are
// Governor-only, same as the original requireGovernor gate.
@Controller("program")
@UseGuards(AuthGuard, CapabilityGuard)
export class ProgramController {
  constructor(
    @Inject(ListProgramsUseCase) private readonly listPrograms: ListProgramsUseCase,
    @Inject(ListProgramsDetailedUseCase)
    private readonly listProgramsDetailed: ListProgramsDetailedUseCase,
    @Inject(CreateProgramUseCase) private readonly createProgram: CreateProgramUseCase,
    @Inject(DeleteProgramUseCase) private readonly deleteProgram: DeleteProgramUseCase,
  ) {}

  @Post("list")
  @RequireCapability("manage_operations")
  async list(): Promise<{ programs: string[] }> {
    return { programs: await this.listPrograms.execute() };
  }

  // Known Gap #5 (PR #184). Governor-only: the only caller is Admin's
  // remove-Program form.
  @Post("list-detailed")
  @RequireCapability("administer")
  async listDetailed(): Promise<ProgramListDetailedResponse> {
    return { programs: await this.listProgramsDetailed.execute() };
  }

  @Post("create")
  @RequireCapability("administer")
  async create(@Body() body: CreateProgramRequest): Promise<Program> {
    try {
      return await this.createProgram.execute(body.name);
    } catch (error) {
      if (error instanceof DuplicateProgramError) throw new ConflictException(error.message);
      throw error;
    }
  }

  @Post("delete")
  @RequireCapability("administer")
  async delete(@Body() body: DeleteProgramRequest): Promise<{ ok: true }> {
    try {
      await this.deleteProgram.execute(body.id);
      return { ok: true };
    } catch (error) {
      if (error instanceof ProgramInUseError) throw new ConflictException(error.message);
      throw error;
    }
  }
}
