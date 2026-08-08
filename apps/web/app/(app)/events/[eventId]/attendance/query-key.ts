// The attendance grid's cache key, kept out of both the client grid and the
// server action so anything that writes this Event's attendance can invalidate
// it without pulling React into its module graph (ADR 0013).
export const eventGridQueryKey = (eventId: string) => ["event-grid", eventId];
