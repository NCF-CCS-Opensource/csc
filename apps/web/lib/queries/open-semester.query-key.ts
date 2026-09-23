// The current-open-Semester lookup's cache key, shared by every page that
// needs to know whether a Semester is open. Kept out of both the fetcher and
// any client view so a write that opens or closes a Semester can invalidate
// it without pulling React into a server-action module's graph (ADR 0013).
export const openSemesterQueryKey = ["open-semester"];

// The Next.js Data Cache tag for getOpenSemester() (issue #307), kept here
// rather than in open-semester.ts: that file is "use server" and can only
// export async functions, and admin/actions.ts needs this constant too.
export const OPEN_SEMESTER_CACHE_TAG = "open-semester";
