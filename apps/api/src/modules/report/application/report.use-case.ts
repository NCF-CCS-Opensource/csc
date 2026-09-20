import { Inject, Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import type {
  FinancialReportData,
  PerEventReportData,
  PerSemesterReportData,
  PerStudentReportData,
} from "@attendance/contracts";
import { REPORT_REPOSITORY, type ReportRepository } from "../domain/report-repository";
import {
  computeFinancialReport,
  computePerEventReport,
  computePerSemesterReport,
  computePerStudentReport,
  isEventPastInManila,
} from "../domain/report";

@Injectable()
export class ReportUseCase {
  constructor(@Inject(REPORT_REPOSITORY) private readonly reportRepository: ReportRepository) {}

  async perEvent(eventId: string): Promise<PerEventReportData> {
    const input = await this.reportRepository.perEventInput(eventId);
    if (!input) throw new NotFoundException("Event not found");
    if (!isEventPastInManila(input.event.date)) {
      throw new BadRequestException("Report generation is only available for past events");
    }
    return computePerEventReport(input);
  }

  async perStudent(studentId: string, semesterId: string): Promise<PerStudentReportData> {
    const input = await this.reportRepository.perStudentInput(studentId, semesterId);
    if (!input) throw new NotFoundException("Student or semester not found");
    return computePerStudentReport(input);
  }

  async perSemester(semesterId: string): Promise<PerSemesterReportData> {
    const input = await this.reportRepository.perSemesterInput(semesterId);
    if (!input) throw new NotFoundException("Semester not found");
    return computePerSemesterReport(input);
  }

  async financial(semesterId: string): Promise<FinancialReportData> {
    const input = await this.reportRepository.financialInput(semesterId);
    if (!input) throw new NotFoundException("Semester not found");
    return computeFinancialReport(input);
  }
}
