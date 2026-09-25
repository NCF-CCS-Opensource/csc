import { Controller, Inject, Post, UseGuards } from "@nestjs/common";
import type { DepartmentFundSummary } from "@attendance/contracts";
import { AuthGuard } from "../../../shared/presentation/auth.guard";
import { CapabilityGuard } from "../../../shared/presentation/capability.guard";
import { RequireCapability } from "../../../shared/presentation/capability.decorator";
import { DepartmentFundUseCase } from "../application/department-fund.use-case";

// The Department Fund summary read (issue #346). Any Officer may view the Fund
// (manage_operations), matching the /finance page's gate; a Student is denied.
@Controller("finance")
@UseGuards(AuthGuard, CapabilityGuard)
export class FinanceController {
  constructor(
    @Inject(DepartmentFundUseCase) private readonly departmentFund: DepartmentFundUseCase,
  ) {}

  @Post("summary")
  @RequireCapability("manage_operations")
  async summary(): Promise<DepartmentFundSummary> {
    return this.departmentFund.execute();
  }
}
