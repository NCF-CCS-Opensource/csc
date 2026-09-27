import {
  Body,
  ConflictException,
  Controller,
  Inject,
  NotFoundException,
  Post,
  UseGuards,
} from "@nestjs/common";
import type {
  CreateExpenseCategoryRequest,
  DeleteExpenseCategoryRequest,
  ExpenseCategory,
  ExpenseCategoryListDetailedResponse,
  ExpenseCategoryListResponse,
  RenameExpenseCategoryRequest,
} from "@attendance/contracts";
import { AuthGuard } from "../../../shared/presentation/auth.guard";
import { CapabilityGuard } from "../../../shared/presentation/capability.guard";
import { RequireCapability } from "../../../shared/presentation/capability.decorator";
import {
  CreateExpenseCategoryUseCase,
  DeleteExpenseCategoryUseCase,
  ListExpenseCategoriesDetailedUseCase,
  ListExpenseCategoriesUseCase,
  RenameExpenseCategoryUseCase,
} from "../application/expense-category.use-cases";
import {
  DuplicateExpenseCategoryError,
  ExpenseCategoryInUseError,
  ExpenseCategoryNotFoundError,
} from "../domain/expense-category-repository";

// Mirrors the program/* controller (issue #345). Listing is available to any
// Officer (manage_operations) so the record-Expense form can populate its
// category picker; create/rename/delete are Governor-only (administer).
@Controller("expense-category")
@UseGuards(AuthGuard, CapabilityGuard)
export class ExpenseCategoryController {
  constructor(
    @Inject(ListExpenseCategoriesUseCase)
    private readonly listCategories: ListExpenseCategoriesUseCase,
    @Inject(ListExpenseCategoriesDetailedUseCase)
    private readonly listCategoriesDetailed: ListExpenseCategoriesDetailedUseCase,
    @Inject(CreateExpenseCategoryUseCase)
    private readonly createCategory: CreateExpenseCategoryUseCase,
    @Inject(RenameExpenseCategoryUseCase)
    private readonly renameCategory: RenameExpenseCategoryUseCase,
    @Inject(DeleteExpenseCategoryUseCase)
    private readonly deleteCategory: DeleteExpenseCategoryUseCase,
  ) {}

  @Post("list")
  @RequireCapability("manage_operations")
  async list(): Promise<ExpenseCategoryListResponse> {
    return { categories: await this.listCategories.execute() };
  }

  // Governor-only: the only caller is Admin's rename/remove-Category forms.
  @Post("list-detailed")
  @RequireCapability("administer")
  async listDetailed(): Promise<ExpenseCategoryListDetailedResponse> {
    return { categories: await this.listCategoriesDetailed.execute() };
  }

  @Post("create")
  @RequireCapability("administer")
  async create(@Body() body: CreateExpenseCategoryRequest): Promise<ExpenseCategory> {
    try {
      return await this.createCategory.execute(body.name);
    } catch (error) {
      if (error instanceof DuplicateExpenseCategoryError)
        throw new ConflictException(error.message);
      throw error;
    }
  }

  @Post("rename")
  @RequireCapability("administer")
  async rename(@Body() body: RenameExpenseCategoryRequest): Promise<ExpenseCategory> {
    try {
      return await this.renameCategory.execute(body.id, body.name);
    } catch (error) {
      if (error instanceof DuplicateExpenseCategoryError)
        throw new ConflictException(error.message);
      if (error instanceof ExpenseCategoryNotFoundError)
        throw new NotFoundException(error.message);
      throw error;
    }
  }

  @Post("delete")
  @RequireCapability("administer")
  async delete(@Body() body: DeleteExpenseCategoryRequest): Promise<{ ok: true }> {
    try {
      await this.deleteCategory.execute(body.id);
      return { ok: true };
    } catch (error) {
      if (error instanceof ExpenseCategoryInUseError) throw new ConflictException(error.message);
      throw error;
    }
  }
}
