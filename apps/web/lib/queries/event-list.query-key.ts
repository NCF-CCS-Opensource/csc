// The Event list fetch's cache key (issue #277), kept out of the fetcher
// module so a write that creates, edits, or deletes an Event can invalidate
// it independently.
export const eventListQueryKey = ["event-list"];
