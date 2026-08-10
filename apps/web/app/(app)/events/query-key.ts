// The Events list's cache key, kept out of both the client view and the server
// action so anything that writes Events can invalidate it without pulling React
// into its module graph (ADR 0013).
export const eventsQueryKey = ["events-snapshot"];
