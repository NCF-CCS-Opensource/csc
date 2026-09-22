import type { QueryClient } from "@tanstack/react-query";
import { dashboardQueryKey } from "../dashboard/query-key";
import { eventsQueryKey } from "../events/query-key";
import { myAttendanceQueryKey } from "../my-attendance/query-key";
import { studentsQueryKey } from "../students/query-key";

// Program is edited here (Server Action, no client mutation to hook
// onSuccess into) but read from the Students roster and the Dashboard's
// governor counts — ADR 0013 requires the edit invalidate both readers' keys,
// since neither page's cache lives on this route.
export function invalidateProgramCaches(queryClient: Pick<QueryClient, "invalidateQueries">) {
  queryClient.invalidateQueries({ queryKey: studentsQueryKey });
  queryClient.invalidateQueries({ queryKey: dashboardQueryKey });
}

// Semester is edited here but its open/closed state and dates are read by the
// Dashboard, Events (gates Event creation), and My Attendance pages.
export function invalidateSemesterCaches(queryClient: Pick<QueryClient, "invalidateQueries">) {
  queryClient.invalidateQueries({ queryKey: dashboardQueryKey });
  queryClient.invalidateQueries({ queryKey: eventsQueryKey });
  queryClient.invalidateQueries({ queryKey: myAttendanceQueryKey });
}
