import type { SemesterResponse } from "@attendance/contracts";
import type { Semester } from "../domain/semester";

export function presentSemester(semester: Semester): SemesterResponse {
  return {
    id: semester.id,
    startDate: semester.startDate,
    endDate: semester.endDate,
    closedAt: semester.closedAt ? semester.closedAt.toISOString() : null,
  };
}
