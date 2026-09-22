// The Program list fetch's cache key (issue #277), kept alongside
// open-semester.query-key.ts's rationale: out of the fetcher module so a
// write that adds or removes a Program can invalidate it independently.
export const programListQueryKey = ["program-list"];
