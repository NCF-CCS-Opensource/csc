import { Module } from "@nestjs/common";
import { TOKEN_VERIFIER } from "../../shared/domain/token-verifier";
import { ClerkTokenVerifier } from "../../shared/infrastructure/identity-token-verifier";
import { STUDENT_REPOSITORY } from "../student/domain/student-repository";
import { DrizzleStudentRepository } from "../student/infrastructure/drizzle-student.repository";
import { AuthGuard } from "../../shared/presentation/auth.guard";
import { CapabilityGuard } from "../../shared/presentation/capability.guard";
import { EXPENSE_CATEGORY_REPOSITORY } from "./domain/expense-category-repository";
import { DrizzleExpenseCategoryRepository } from "./infrastructure/drizzle-expense-category.repository";
import {
  CreateExpenseCategoryUseCase,
  DeleteExpenseCategoryUseCase,
  ListExpenseCategoriesDetailedUseCase,
  ListExpenseCategoriesUseCase,
  RenameExpenseCategoryUseCase,
} from "./application/expense-category.use-cases";
import { ExpenseCategoryController } from "./presentation/expense-category.controller";

// The Finance module (issue #344). Finance #1 (#345) ships the Governor-managed
// Expense Category vocabulary; later tickets add the Expense record/void and
// the Department Fund summary to this same module.
@Module({
  controllers: [ExpenseCategoryController],
  providers: [
    { provide: TOKEN_VERIFIER, useClass: ClerkTokenVerifier },
    { provide: STUDENT_REPOSITORY, useClass: DrizzleStudentRepository },
    { provide: EXPENSE_CATEGORY_REPOSITORY, useClass: DrizzleExpenseCategoryRepository },
    ListExpenseCategoriesUseCase,
    ListExpenseCategoriesDetailedUseCase,
    CreateExpenseCategoryUseCase,
    RenameExpenseCategoryUseCase,
    DeleteExpenseCategoryUseCase,
    AuthGuard,
    CapabilityGuard,
  ],
})
export class FinanceModule {}
