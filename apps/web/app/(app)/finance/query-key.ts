// The Department Fund's cache key, kept out of both the client view and the
// server action so anything that later writes an Expense or Payment can
// invalidate it without pulling React into its module graph (ADR 0013).
// Matches the sibling "-snapshot" keys (dashboard/students/clearance).
export const financeQueryKey = ["finance-snapshot"];
