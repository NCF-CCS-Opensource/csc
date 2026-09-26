import { Body, Controller, HttpException, Inject, Post, UseGuards } from "@nestjs/common";
import type {
  ExpenseListResponse,
  RecordExpenseRequest,
  VoidExpenseRequest,
} from "@attendance/contracts";
import type { Actor } from "../../../shared/domain/actor";
import { CallerActor } from "../../../shared/presentation/actor.decorator";
import { AuthGuard } from "../../../shared/presentation/auth.guard";
import { CapabilityGuard } from "../../../shared/presentation/capability.guard";
import { RequireCapability } from "../../../shared/presentation/capability.decorator";
import { ExpenseUseCase } from "../application/expense.use-case";

// Recording and voiding an Expense from /finance (issue #347). Every route
// needs manage_operations (any Officer); a Student is refused with 403 by the
// CapabilityGuard. Recording attaches to the open Semester and the caller —
// the client never asserts either — and is refused (409) when none is open.
@Controller("expense")
@UseGuards(AuthGuard, CapabilityGuard)
export class ExpenseController {
  constructor(@Inject(ExpenseUseCase) private readonly expenses: ExpenseUseCase) {}

  @Post("record")
  @RequireCapability("manage_operations")
  async record(@CallerActor() actor: Actor, @Body() body: RecordExpenseRequest) {
    const amount = typeof body?.amount === "string" ? Number(body.amount) : NaN;
    if (!Number.isFinite(amount) || amount <= 0) throw new HttpException("Invalid amount", 400);
    if (typeof body.description !== "string" || !body.description.trim()) {
      throw new HttpException("Invalid description", 400);
    }
    if (typeof body.category !== "string" || !body.category.trim()) {
      throw new HttpException("Invalid category", 400);
    }
    if (typeof body.incurredOn !== "string" || Number.isNaN(Date.parse(body.incurredOn))) {
      throw new HttpException("Invalid date", 400);
    }
    await this.expenses.record(
      {
        amount: amount.toFixed(2),
        description: body.description.trim(),
        category: body.category,
        incurredOn: body.incurredOn.slice(0, 10),
      },
      actor.id,
    );
    return { ok: true };
  }

  @Post("void")
  @RequireCapability("manage_operations")
  async void(@CallerActor() actor: Actor, @Body() body: VoidExpenseRequest) {
    if (typeof body?.expenseId !== "string") throw new HttpException("Invalid request", 400);
    await this.expenses.voidExpense(body.expenseId, actor.id);
    return { ok: true };
  }

  @Post("list")
  @RequireCapability("manage_operations")
  async list(): Promise<ExpenseListResponse> {
    return { expenses: await this.expenses.list() };
  }
}
