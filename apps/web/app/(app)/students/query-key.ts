// The Students roster's cache key, kept out of both the client view and the
// server action so anything that writes Students can invalidate it without
// pulling React into its module graph (ADR 0013).
export const studentsQueryKey = ["students-snapshot"];
