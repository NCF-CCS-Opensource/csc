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
import { EXPENSE_REPOSITORY } from "./domain/expense-repository";
import { DrizzleExpenseRepository } from "./infrastructure/drizzle-expense.repository";
import { DepartmentFundUseCase } from "./application/department-fund.use-case";
import { ExpenseUseCase } from "./application/expense.use-case";
import { FinanceController } from "./presentation/finance.controller";
import { ExpenseController } from "./presentation/expense.controller";
import { REPORT_REPOSITORY } from "../report/domain/report-repository";
import { DrizzleReportRepository } from "../report/infrastructure/drizzle-report.repository";
import { SEMESTER_REPOSITORY } from "../semester/domain/semester-repository";
import { DrizzleSemesterRepository } from "../semester/infrastructure/drizzle-semester.repository";

// The Finance module (issue #344). Finance #1 (#345) ships the Governor-managed
// Expense Category vocabulary; Finance #2 (#346) adds the empty Expenses table
// and the read-only Department Fund summary, which reuses the report module's
// financial computation per Semester (REPORT_REPOSITORY) plus the Semester list.
@Module({
  controllers: [ExpenseCategoryController, FinanceController, ExpenseController],
  providers: [
    { provide: TOKEN_VERIFIER, useClass: ClerkTokenVerifier },
    { provide: STUDENT_REPOSITORY, useClass: DrizzleStudentRepository },
    { provide: EXPENSE_CATEGORY_REPOSITORY, useClass: DrizzleExpenseCategoryRepository },
    { provide: EXPENSE_REPOSITORY, useClass: DrizzleExpenseRepository },
    { provide: REPORT_REPOSITORY, useClass: DrizzleReportRepository },
    { provide: SEMESTER_REPOSITORY, useClass: DrizzleSemesterRepository },
    ListExpenseCategoriesUseCase,
    ListExpenseCategoriesDetailedUseCase,
    CreateExpenseCategoryUseCase,
    RenameExpenseCategoryUseCase,
    DeleteExpenseCategoryUseCase,
    DepartmentFundUseCase,
    ExpenseUseCase,
    AuthGuard,
    CapabilityGuard,
  ],
})
export class FinanceModule {}
