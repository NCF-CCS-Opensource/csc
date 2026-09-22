// The current-open-Semester lookup's cache key, shared by every page that
// needs to know whether a Semester is open. Kept out of both the fetcher and
// any client view so a write that opens or closes a Semester can invalidate
// it without pulling React into a server-action module's graph (ADR 0013).
export const openSemesterQueryKey = ["open-semester"];
