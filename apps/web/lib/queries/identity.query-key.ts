// The signed-in caller's identity cache key, shared by every gated page's
// layout shell so a revisit reads from the same persisted cache as
// Semester/Program/Event data instead of a bespoke localStorage key
// (issue #285, ADR 0013).
export const identityQueryKey = ["identity"];
