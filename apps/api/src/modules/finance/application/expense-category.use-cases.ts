import { Inject, Injectable } from "@nestjs/common";
import type { ExpenseCategory } from "@attendance/contracts";
import {
  EXPENSE_CATEGORY_REPOSITORY,
  type ExpenseCategoryRepository,
} from "../domain/expense-category-repository";

// Governor-managed Expense Category vocabulary (issue #345). Mirrors the
// program/* use cases: listing feeds the record-Expense picker (any Officer),
// mutations are Governor-only.
@Injectable()
export class ListExpenseCategoriesUseCase {
  constructor(
    @Inject(EXPENSE_CATEGORY_REPOSITORY) private readonly categories: ExpenseCategoryRepository,
  ) {}

  execute(): Promise<string[]> {
    return this.categories.listNames();
  }
}

// Carries the id the admin rename/remove forms need (Programs' Known Gap #5).
@Injectable()
export class ListExpenseCategoriesDetailedUseCase {
  constructor(
    @Inject(EXPENSE_CATEGORY_REPOSITORY) private readonly categories: ExpenseCategoryRepository,
  ) {}

  execute(): Promise<ExpenseCategory[]> {
    return this.categories.listAll();
  }
}

@Injectable()
export class CreateExpenseCategoryUseCase {
  constructor(
    @Inject(EXPENSE_CATEGORY_REPOSITORY) private readonly categories: ExpenseCategoryRepository,
  ) {}

  execute(name: string): Promise<ExpenseCategory> {
    return this.categories.create(name.trim());
  }
}

@Injectable()
export class RenameExpenseCategoryUseCase {
  constructor(
    @Inject(EXPENSE_CATEGORY_REPOSITORY) private readonly categories: ExpenseCategoryRepository,
  ) {}

  execute(id: string, name: string): Promise<ExpenseCategory> {
    return this.categories.rename(id, name.trim());
  }
}

@Injectable()
export class DeleteExpenseCategoryUseCase {
  constructor(
    @Inject(EXPENSE_CATEGORY_REPOSITORY) private readonly categories: ExpenseCategoryRepository,
  ) {}

  execute(id: string): Promise<void> {
    return this.categories.delete(id);
  }
}
