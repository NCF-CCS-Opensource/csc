// My Attendance's cache key, kept out of both the client view and the server
// action so anything that writes Penalty or Payment data can invalidate it
// without pulling React into its module graph (ADR 0013).
export const myAttendanceQueryKey = ["my-attendance-snapshot"];
