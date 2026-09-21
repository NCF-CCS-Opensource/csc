import { Body, Controller, Inject, Post, UseGuards } from "@nestjs/common";
import type {
  CloseSemesterRequest,
  CreateSemesterRequest,
  DeleteSemesterRequest,
  SemesterListResponse,
  SemesterResponse,
  UpdateSemesterDatesRequest,
} from "@attendance/contracts";
import { AuthGuard } from "../../../shared/presentation/auth.guard";
import { CapabilityGuard } from "../../../shared/presentation/capability.guard";
import { RequireCapability } from "../../../shared/presentation/capability.decorator";
import { runLifecycle } from "../../../shared/presentation/run-lifecycle";
import { CreateSemesterUseCase } from "../application/create-semester.use-case";
import { UpdateSemesterDatesUseCase } from "../application/update-semester-dates.use-case";
import { CloseSemesterUseCase } from "../application/close-semester.use-case";
import { GetOpenSemesterUseCase } from "../application/get-open-semester.use-case";
import { ListSemestersUseCase } from "../application/list-semesters.use-case";
import { DeleteSemesterUseCase } from "../application/delete-semester.use-case";
import { presentSemester } from "./semester.presenter";

// Single-action controllers, one per use case (ADR-0017). "administer" gates
// every write; "manage_operations" lets an Officer read the open Semester to
// scope an Event's date (CONTEXT.md's Semester entry).
@Controller("semester")
@UseGuards(AuthGuard, CapabilityGuard)
export class SemesterController {
  constructor(
    @Inject(CreateSemesterUseCase) private readonly createSemester: CreateSemesterUseCase,
    @Inject(UpdateSemesterDatesUseCase)
    private readonly updateSemesterDates: UpdateSemesterDatesUseCase,
    @Inject(CloseSemesterUseCase) private readonly closeSemester: CloseSemesterUseCase,
    @Inject(GetOpenSemesterUseCase) private readonly getOpenSemester: GetOpenSemesterUseCase,
    @Inject(ListSemestersUseCase) private readonly listSemesters: ListSemestersUseCase,
    @Inject(DeleteSemesterUseCase) private readonly deleteSemester: DeleteSemesterUseCase,
  ) {}

  @Post("create")
  @RequireCapability("administer")
  async create(@Body() body: CreateSemesterRequest): Promise<SemesterResponse> {
    const semester = await runLifecycle(() => this.createSemester.execute(body));
    return presentSemester(semester);
  }

  @Post("update")
  @RequireCapability("administer")
  async update(@Body() body: UpdateSemesterDatesRequest): Promise<SemesterResponse> {
    const semester = await runLifecycle(() =>
      this.updateSemesterDates.execute(body.id, {
        startDate: body.startDate,
        endDate: body.endDate,
      }),
    );
    return presentSemester(semester);
  }

  @Post("close")
  @RequireCapability("administer")
  async close(@Body() body: CloseSemesterRequest): Promise<SemesterResponse> {
    const semester = await runLifecycle(() => this.closeSemester.execute(body.id));
    return presentSemester(semester);
  }

  @Post("current")
  @RequireCapability("view_own_attendance")
  async current(): Promise<SemesterResponse | null> {
    const semester = await this.getOpenSemester.execute();
    return semester ? presentSemester(semester) : null;
  }

  // Known Gap #4 (PR #184): the minimum capability shared by both callers
  // (Admin is Governor-only, Analytics is any Officer or Governor).
  @Post("list")
  @RequireCapability("manage_operations")
  async list(): Promise<SemesterListResponse> {
    const semesters = await this.listSemesters.execute();
    return { semesters: semesters.map(presentSemester) };
  }

  // Known Gap #2 (PR #184), ported from admin/actions.ts#deleteSemester.
  @Post("delete")
  @RequireCapability("administer")
  async delete(@Body() body: DeleteSemesterRequest): Promise<{ ok: true }> {
    await runLifecycle(() => this.deleteSemester.execute(body.id));
    return { ok: true };
  }
}
