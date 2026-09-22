// The Student's own attendance/Ledger fetch's cache key (issue #277).
// Parameterized by Semester, since a Student's Ledger is scoped to one open
// Semester at a time — a write that records a scan or a Payment invalidates
// this same key rather than a page redefining its own.
export const studentLedgerQueryKey = (semesterId: string) => ["student-ledger", semesterId];
