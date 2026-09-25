import { Inject, Injectable } from "@nestjs/common";
import type { DepartmentFundSummary, FinancialReportData } from "@attendance/contracts";
import { REPORT_REPOSITORY, type ReportRepository } from "../../report/domain/report-repository";
import { computeFinancialReport } from "../../report/domain/report";
import { SEMESTER_REPOSITORY, type SemesterRepository } from "../../semester/domain/semester-repository";
import { EXPENSE_REPOSITORY, type ExpenseRepository } from "../domain/expense-repository";
import { computeDepartmentFund } from "../domain/department-fund";

// Assembles the Department Fund summary (issue #346). Money-in is the existing
// financial computation run once per Semester and folded together — the Fund
// never re-implements penalty/SAF arithmetic — money-out is the un-voided
// Expenses; computeDepartmentFund composes them (ADR 0021, ADR 0025).
@Injectable()
export class DepartmentFundUseCase {
  constructor(
    @Inject(REPORT_REPOSITORY) private readonly reports: ReportRepository,
    @Inject(SEMESTER_REPOSITORY) private readonly semesters: SemesterRepository,
    @Inject(EXPENSE_REPOSITORY) private readonly expenses: ExpenseRepository,
  ) {}

  async execute(): Promise<DepartmentFundSummary> {
    const allSemesters = await this.semesters.findAll();

    // ponytail: one financial computation per Semester — fine for a council's
    // handful of Semesters. If the Semester count ever grows large, swap this
    // for a single cross-Semester SUM of un-voided Payments.
    const [semesterReports, expenses] = await Promise.all([
      Promise.all(
        allSemesters.map(async (semester) => {
          const input = await this.reports.financialInput(semester.id);
          return input ? computeFinancialReport(input) : null;
        }),
      ),
      this.expenses.listForFund(),
    ]);

    return computeDepartmentFund({
      semesterReports: semesterReports.filter((report): report is FinancialReportData => report !== null),
      expenses,
    });
  }
}
